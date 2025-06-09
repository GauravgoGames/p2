import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

// Match status enum
export const matchStatusEnum = pgEnum('match_status', ['upcoming', 'ongoing', 'completed', 'tie', 'void']);

// Ticket status enum
export const ticketStatusEnum = pgEnum('ticket_status', ['open', 'in_progress', 'resolved', 'closed']);

// Ticket priority enum
export const ticketPriorityEnum = pgEnum('ticket_priority', ['low', 'medium', 'high', 'urgent']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  email: text("email"),
  profileImage: text("profile_image"),
  role: userRoleEnum("role").default('user').notNull(),
  points: integer("points").default(0).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  proaceUserId: text("proace_user_id"),
  proaceDisqusId: text("proace_disqus_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  isCustom: boolean("is_custom").default(false).notNull(),
});

// Tournaments table
export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tournament teams junction table (many-to-many relationship)
export const tournamentTeams = pgTable("tournament_teams", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull(),
  teamId: integer("team_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Matches table
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id"),
  tournamentName: text("tournament_name").notNull(), // Keep for backward compatibility
  team1Id: integer("team1_id").notNull(),
  team2Id: integer("team2_id").notNull(),
  location: text("location").notNull(),
  matchDate: timestamp("match_date").notNull(),
  status: matchStatusEnum("status").default('upcoming').notNull(),
  tossWinnerId: integer("toss_winner_id"),
  matchWinnerId: integer("match_winner_id"),
  team1Score: text("team1_score"),
  team2Score: text("team2_score"),
  resultSummary: text("result_summary"),
});

// Predictions table
export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  matchId: integer("match_id").notNull(),
  predictedTossWinnerId: integer("predicted_toss_winner_id"),
  predictedMatchWinnerId: integer("predicted_match_winner_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  pointsEarned: integer("points_earned").default(0),
});

// Points Ledger table to track point history
export const pointsLedger = pgTable("points_ledger", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  matchId: integer("match_id").notNull(),
  points: integer("points").notNull(),
  reason: text("reason").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Site settings table
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Support tickets table
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subject: text("subject").notNull(),
  status: ticketStatusEnum("status").default('open').notNull(),
  priority: ticketPriorityEnum("priority").default('medium').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  assignedToUserId: integer("assigned_to_user_id"), // admin who handles the ticket
});

// Ticket messages table for chat history
export const ticketMessages = pgTable("ticket_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  isAdminReply: boolean("is_admin_reply").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema validation
export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    displayName: true,
    email: true,
    profileImage: true,
    role: true,
    proaceUserId: true,
    proaceDisqusId: true,
  })
  .extend({
    // Make profile image truly optional
    profileImage: z.string().url().optional().or(z.literal('')),
    // Make email and display name also properly optional
    email: z.string().email().optional().or(z.literal('')),
    displayName: z.string().optional().or(z.literal('')),
    // Make proace user ID optional
    proaceUserId: z.string().optional().or(z.literal('')),
    // Make proace disqus ID optional
    proaceDisqusId: z.string().optional().or(z.literal('')),
  });

export const insertTeamSchema = createInsertSchema(teams)
  .extend({
    logoUrl: z.string().optional(),
    isCustom: z.boolean().default(true)
  });

export const insertTournamentSchema = createInsertSchema(tournaments)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    imageUrl: z.string().optional(),
    description: z.string().optional().or(z.literal('')),
    startDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
    endDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  });

export const insertTournamentTeamSchema = createInsertSchema(tournamentTeams)
  .omit({
    id: true,
    createdAt: true,
  });

export const insertMatchSchema = createInsertSchema(matches)
  .omit({
    tossWinnerId: true,
    matchWinnerId: true,
    team1Score: true,
    team2Score: true,
    resultSummary: true,
  })
  .extend({
    // Convert matchDate to a valid string format for proper date handling
    matchDate: z.string()
      .transform(str => new Date(str)),
    // Ensure team1Id and team2Id are numbers
    team1Id: z.number(),
    team2Id: z.number(),
    // Make tournamentId optional for backward compatibility
    tournamentId: z.number().optional(),
  });

export const updateMatchResultSchema = createInsertSchema(matches).pick({
  tossWinnerId: true,
  matchWinnerId: true,
  team1Score: true,
  team2Score: true,
  resultSummary: true,
  status: true,
});

export const insertPredictionSchema = createInsertSchema(predictions).omit({
  id: true,
  createdAt: true,
  pointsEarned: true,
});

export const siteSettingsSchema = createInsertSchema(siteSettings).omit({
  id: true,
  updatedAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;

export type TournamentTeam = typeof tournamentTeams.$inferSelect;
export type InsertTournamentTeam = z.infer<typeof insertTournamentTeamSchema>;

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type UpdateMatchResult = z.infer<typeof updateMatchResultSchema>;

export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;

export type PointsLedgerEntry = typeof pointsLedger.$inferSelect;

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof siteSettingsSchema>;

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketMessage = typeof ticketMessages.$inferInsert;

// Extended TicketMessage interface with username for frontend display
export interface TicketMessageWithUsername extends TicketMessage {
  username?: string;
}
