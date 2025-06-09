import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight, Shield, ShieldCheck } from 'lucide-react';
import { User, InsertUser } from '@shared/schema';

// User create form schema
const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().optional(),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  role: z.enum(['user', 'admin']).default('user'),
});

// User update form schema
const updateUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  displayName: z.string().optional(),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  role: z.enum(['user', 'admin']),
  password: z.string().optional(), // Made completely optional
  proaceUserId: z.string().optional(),
  isVerified: z.boolean(),
});

const ManageUsers = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  
  // Fetch all users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
  });
  
  // Create user form
  const createUserForm = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      password: '',
      displayName: '',
      email: '',
      role: 'user',
    },
  });
  
  // Edit user form
  const editUserForm = useForm<z.infer<typeof updateUserSchema>>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      username: '',
      displayName: '',
      email: '',
      role: 'user',
      password: '',
      proaceUserId: '',
      isVerified: false,
    },
  });
  
  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createUserSchema>) => {
      // Add admin creation header to prevent auto-login
      const res = await apiRequest('POST', '/api/register', data, 
        'x-admin-creation: true'
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'User Created',
        description: 'The user has been successfully created',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setCreateDialogOpen(false);
      createUserForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    },
  });
  
  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number; userData: z.infer<typeof updateUserSchema> }) => {
      const res = await apiRequest('PATCH', `/api/users/${data.id}`, data.userData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'User Updated',
        description: 'The user details have been successfully updated',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setEditDialogOpen(false);
      editUserForm.reset();
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    },
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/users/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'User Deleted',
        description: 'The user has been successfully deleted',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    },
  });

  // Quick verification mutation
  const verifyUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest('PATCH', `/api/admin/users/${userId}/verify`, { isVerified: true });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'User Verified',
        description: 'The user has been successfully verified',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify user',
        variant: 'destructive',
      });
    },
  });
  
  // Form submission handlers
  const onCreateUserSubmit = (data: z.infer<typeof createUserSchema>) => {
    createUserMutation.mutate(data);
  };
  
  const onUpdateUserSubmit = (data: z.infer<typeof updateUserSchema>) => {
    if (!selectedUser) return;
    updateUserMutation.mutate({ id: selectedUser.id, userData: data });
  };
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    editUserForm.reset({
      username: user.username,
      displayName: user.displayName || '',
      email: user.email || '',
      role: user.role || 'user',
      password: '', // Empty for optional password change
      proaceUserId: user.proaceUserId || '',
      isVerified: user.isVerified || false,
    });
    setEditDialogOpen(true);
  };
  
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteUser = () => {
    if (!selectedUser) return;
    deleteUserMutation.mutate(selectedUser.id);
  };
  
  // Filter and paginate users
  const filteredUsers = users?.filter(user => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      (user.displayName && user.displayName.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query))
    );
  });
  
  const paginatedUsers = filteredUsers?.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );
  
  const totalPages = filteredUsers ? Math.ceil(filteredUsers.length / usersPerPage) : 0;
  
  // Generate pagination items
  const generatePaginationItems = () => {
    const items = [];
    
    // Always show first page
    items.push(
      <PaginationItem key="first">
        <Button 
          variant={currentPage === 1 ? "default" : "outline"}
          className="h-8 w-8 p-0"
          onClick={() => setCurrentPage(1)}
        >
          1
        </Button>
      </PaginationItem>
    );
    
    // Show ellipsis if needed
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <span className="mx-2">...</span>
        </PaginationItem>
      );
    }
    
    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last pages as they're always shown
      
      items.push(
        <PaginationItem key={i}>
          <Button 
            variant={currentPage === i ? "default" : "outline"}
            className="h-8 w-8 p-0"
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </Button>
        </PaginationItem>
      );
    }
    
    // Show ellipsis if needed
    if (currentPage < totalPages - 2 && totalPages > 3) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <span className="mx-2">...</span>
        </PaginationItem>
      );
    }
    
    // Always show last page if there is more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <Button 
            variant={currentPage === totalPages ? "default" : "outline"}
            className="h-8 w-8 p-0"
            onClick={() => setCurrentPage(totalPages)}
          >
            {totalPages}
          </Button>
        </PaginationItem>
      );
    }
    
    return items;
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-heading">Manage Users</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View, add, edit, and remove users from the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : paginatedUsers && paginatedUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>ProAce ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={user.profileImage || ''} alt={user.username} />
                            <AvatarFallback className="bg-primary text-white">
                              {user.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.displayName || user.username}</div>
                            <div className="text-xs text-muted-foreground">@{user.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>{user.proaceUserId || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={user.isVerified ? 'default' : 'destructive'}>
                          {user.isVerified ? 'Verified' : 'Needs Verification'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'secondary' : 'outline'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{user.points}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!user.isVerified && (
                              <DropdownMenuItem 
                                onClick={() => verifyUserMutation.mutate(user.id)}
                                className="text-green-600 focus:text-green-600"
                              >
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Verify User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-neutral-500">
              {searchQuery ? 'No users match your search' : 'No users found'}
            </div>
          )}
          
          {filteredUsers && filteredUsers.length > usersPerPage && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button 
                      variant="outline"
                      className="h-8 px-2 gap-1" 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </Button>
                  </PaginationItem>
                  
                  {generatePaginationItems()}
                  
                  <PaginationItem>
                    <Button 
                      variant="outline"
                      className="h-8 px-2 gap-1"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the platform
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createUserForm}>
            <form onSubmit={createUserForm.handleSubmit(onCreateUserSubmit)} className="space-y-6">
              <FormField
                control={createUserForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createUserForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createUserForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter display name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      {selectedUser && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user details for {selectedUser.username}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editUserForm}>
              <form onSubmit={editUserForm.handleSubmit(onUpdateUserSubmit)} className="space-y-4 max-h-96 overflow-y-auto">
                <FormField
                  control={editUserForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editUserForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter display name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editUserForm.control}
                  name="proaceUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ProAce User ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter ProAce User ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editUserForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter new password" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                

                
                <FormField
                  control={editUserForm.control}
                  name="isVerified"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Status</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === 'true')}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select verification status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Verified</SelectItem>
                          <SelectItem value="false">Not Verified</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editUserForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateUserMutation.isPending}
                  >
                    {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete User Confirmation Dialog */}
      {selectedUser && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this user? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={selectedUser.profileImage || ''} alt={selectedUser.username} />
                  <AvatarFallback className="bg-primary text-white">
                    {selectedUser.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.displayName || selectedUser.username}</p>
                  <p className="text-sm text-neutral-500">@{selectedUser.username}</p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDeleteUser}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ManageUsers;
