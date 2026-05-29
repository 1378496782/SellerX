#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, text):
    # Create transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw round icon with purple gradient background
    margin = size // 10  # 10% margin
    circle_box = [margin, margin, size - margin, size - margin]
    
    # Draw main circle
    draw.ellipse(circle_box, fill=(102, 126, 234, 255))
    
    # Draw border circle
    border_width = max(2, size // 20)
    border_box = [margin + border_width//2, margin + border_width//2, 
                  size - margin - border_width//2, size - margin - border_width//2]
    draw.ellipse(border_box, outline=(76, 94, 178, 255), width=border_width)
    
    # Try to draw text
    try:
        # Try to use system font
        font_size = size // 2
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
        except:
            font = ImageFont.load_default()
        
        # Calculate text position
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (size - text_width) // 2
        y = (size - text_height) // 2 - bbox[1]
        
        draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    except:
        pass  # Just leave as solid color if text fails
    
    return img

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    icons_dir = os.path.join(parent_dir, 'chrome-extension', 'icons')
    
    # Ensure icons directory exists
    os.makedirs(icons_dir, exist_ok=True)
    
    # Create icons
    sizes = [16, 48, 128]
    for size in sizes:
        img = create_icon(size, "S")
        output_path = os.path.join(icons_dir, f'icon{size}.png')
        img.save(output_path, 'PNG')
        print(f"✓ Created {output_path} ({size}x{size})")
    
    print("\nDone! All icons created successfully.")

if __name__ == '__main__':
    main()
