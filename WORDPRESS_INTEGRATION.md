# WordPress Integration Guide for CricProAce

This guide explains how to embed CricProAce match predictions and leaderboard on your WordPress website.

## Available Embed Options

### 1. Live Match Predictions Widget
Shows the latest upcoming/ongoing match with live prediction percentages.

### 2. Live Leaderboard Widget
Displays the top 10 users on the leaderboard with their points and rankings.

## Integration Methods

### Method 1: Using iFrame (Simplest)

#### For Match Predictions:
```html
<iframe 
  src="https://your-domain.com/embed/match" 
  width="100%" 
  height="600" 
  frameborder="0"
  style="max-width: 450px; margin: 0 auto; display: block;">
</iframe>
```

#### For Leaderboard:
```html
<iframe 
  src="https://your-domain.com/embed/leaderboard" 
  width="100%" 
  height="700" 
  frameborder="0"
  style="max-width: 450px; margin: 0 auto; display: block;">
</iframe>
```

### Method 2: WordPress Shortcode

Add this to your theme's `functions.php` file:

```php
// CricProAce Match Predictions Shortcode
function cricproace_match_shortcode($atts) {
    $atts = shortcode_atts(array(
        'height' => '600',
        'width' => '100%',
        'max_width' => '450'
    ), $atts);
    
    return '<div style="text-align: center;">
              <iframe src="https://your-domain.com/embed/match" 
                      width="' . esc_attr($atts['width']) . '" 
                      height="' . esc_attr($atts['height']) . '" 
                      frameborder="0"
                      style="max-width: ' . esc_attr($atts['max_width']) . 'px; margin: 0 auto; display: block;">
              </iframe>
            </div>';
}
add_shortcode('cricproace_match', 'cricproace_match_shortcode');

// CricProAce Leaderboard Shortcode
function cricproace_leaderboard_shortcode($atts) {
    $atts = shortcode_atts(array(
        'height' => '700',
        'width' => '100%',
        'max_width' => '450'
    ), $atts);
    
    return '<div style="text-align: center;">
              <iframe src="https://your-domain.com/embed/leaderboard" 
                      width="' . esc_attr($atts['width']) . '" 
                      height="' . esc_attr($atts['height']) . '" 
                      frameborder="0"
                      style="max-width: ' . esc_attr($atts['max_width']) . 'px; margin: 0 auto; display: block;">
              </iframe>
            </div>';
}
add_shortcode('cricproace_leaderboard', 'cricproace_leaderboard_shortcode');
```

Then use these shortcodes in your posts/pages:
```
[cricproace_match]
[cricproace_leaderboard]
```

With custom dimensions:
```
[cricproace_match height="500" max_width="400"]
[cricproace_leaderboard height="800" max_width="500"]
```

### Method 3: WordPress Widget (Sidebar/Footer)

Add this to your theme's `functions.php`:

```php
// CricProAce Widget
class CricProAce_Widget extends WP_Widget {
    
    function __construct() {
        parent::__construct(
            'cricproace_widget',
            'CricProAce Predictions',
            array('description' => 'Display live match predictions or leaderboard')
        );
    }
    
    public function widget($args, $instance) {
        echo $args['before_widget'];
        
        if (!empty($instance['title'])) {
            echo $args['before_title'] . apply_filters('widget_title', $instance['title']) . $args['after_title'];
        }
        
        $type = !empty($instance['type']) ? $instance['type'] : 'match';
        $height = !empty($instance['height']) ? $instance['height'] : '600';
        
        $url = ($type === 'match') ? 'https://your-domain.com/embed/match' : 'https://your-domain.com/embed/leaderboard';
        
        echo '<iframe src="' . esc_url($url) . '" width="100%" height="' . esc_attr($height) . '" frameborder="0"></iframe>';
        
        echo $args['after_widget'];
    }
    
    public function form($instance) {
        $title = !empty($instance['title']) ? $instance['title'] : 'Live Predictions';
        $type = !empty($instance['type']) ? $instance['type'] : 'match';
        $height = !empty($instance['height']) ? $instance['height'] : '600';
        ?>
        <p>
            <label for="<?php echo $this->get_field_id('title'); ?>">Title:</label>
            <input class="widefat" id="<?php echo $this->get_field_id('title'); ?>" 
                   name="<?php echo $this->get_field_name('title'); ?>" type="text" 
                   value="<?php echo esc_attr($title); ?>">
        </p>
        <p>
            <label for="<?php echo $this->get_field_id('type'); ?>">Widget Type:</label>
            <select class="widefat" id="<?php echo $this->get_field_id('type'); ?>" 
                    name="<?php echo $this->get_field_name('type'); ?>">
                <option value="match" <?php selected($type, 'match'); ?>>Match Predictions</option>
                <option value="leaderboard" <?php selected($type, 'leaderboard'); ?>>Leaderboard</option>
            </select>
        </p>
        <p>
            <label for="<?php echo $this->get_field_id('height'); ?>">Height (px):</label>
            <input class="widefat" id="<?php echo $this->get_field_id('height'); ?>" 
                   name="<?php echo $this->get_field_name('height'); ?>" type="number" 
                   value="<?php echo esc_attr($height); ?>">
        </p>
        <?php
    }
    
    public function update($new_instance, $old_instance) {
        $instance = array();
        $instance['title'] = (!empty($new_instance['title'])) ? strip_tags($new_instance['title']) : '';
        $instance['type'] = (!empty($new_instance['type'])) ? strip_tags($new_instance['type']) : 'match';
        $instance['height'] = (!empty($new_instance['height'])) ? strip_tags($new_instance['height']) : '600';
        return $instance;
    }
}

// Register widget
function register_cricproace_widget() {
    register_widget('CricProAce_Widget');
}
add_action('widgets_init', 'register_cricproace_widget');
```

### Method 4: Gutenberg Block (WordPress Block Editor)

Create a custom block by adding this to your theme or plugin:

```javascript
// In your theme's JS file or custom plugin
wp.blocks.registerBlockType('cricproace/embed', {
    title: 'CricProAce Embed',
    icon: 'chart-line',
    category: 'embed',
    attributes: {
        embedType: {
            type: 'string',
            default: 'match'
        },
        height: {
            type: 'string',
            default: '600'
        }
    },
    
    edit: function(props) {
        return wp.element.createElement(
            'div',
            { className: props.className },
            wp.element.createElement(
                'select',
                {
                    value: props.attributes.embedType,
                    onChange: function(e) {
                        props.setAttributes({ embedType: e.target.value });
                    }
                },
                wp.element.createElement('option', { value: 'match' }, 'Match Predictions'),
                wp.element.createElement('option', { value: 'leaderboard' }, 'Leaderboard')
            ),
            wp.element.createElement(
                'input',
                {
                    type: 'number',
                    value: props.attributes.height,
                    placeholder: 'Height in pixels',
                    onChange: function(e) {
                        props.setAttributes({ height: e.target.value });
                    }
                }
            ),
            wp.element.createElement(
                'div',
                { style: { marginTop: '20px', padding: '20px', background: '#f0f0f0' } },
                'CricProAce ' + props.attributes.embedType + ' preview will appear here'
            )
        );
    },
    
    save: function(props) {
        var url = props.attributes.embedType === 'match' 
            ? 'https://your-domain.com/embed/match' 
            : 'https://your-domain.com/embed/leaderboard';
            
        return wp.element.createElement(
            'iframe',
            {
                src: url,
                width: '100%',
                height: props.attributes.height + 'px',
                frameBorder: '0',
                style: { maxWidth: '450px', margin: '0 auto', display: 'block' }
            }
        );
    }
});
```

## Responsive Design

All embed options are mobile-responsive and will adapt to your website's layout.

## Custom Styling

To add custom styling around the embed:

```css
.cricproace-wrapper {
    margin: 20px auto;
    padding: 20px;
    background: #f5f5f5;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.cricproace-wrapper iframe {
    border-radius: 8px;
    overflow: hidden;
}
```

## Advanced Integration

### Auto-refresh
The widgets automatically refresh:
- Match predictions: Every 30 seconds
- Leaderboard: Every 60 seconds

### CORS Configuration
Ensure your CricProAce domain allows embedding by setting appropriate CORS headers.

### SSL/HTTPS
Both your WordPress site and CricProAce should use HTTPS for secure embedding.

## Troubleshooting

1. **Widget not displaying**: Check if your domain is correctly set in the iframe src
2. **Height issues**: Adjust the height parameter based on your content
3. **Mobile display**: The widgets are responsive but you may need to adjust container widths

## Support

For additional support or custom integration requirements, contact: support@cricproace.com

---

**Note**: Replace `https://your-domain.com` with your actual CricProAce domain URL.