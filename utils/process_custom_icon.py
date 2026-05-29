#!/usr/bin/env python3
from PIL import Image, ImageDraw
import os

def make_circle_icon(source_path, output_path, size):
    try:
        # Open original image
        img = Image.open(source_path).convert('RGBA')
        
        # Resize to the target size (maintain aspect ratio, fit within size)
        img.thumbnail((size, size), Image.Resampling.LANCZOS)
        
        # Create a new square image with transparent background
        square_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        
        # Calculate position to center the image
        paste_x = (size - img.width) // 2
        paste_y = (size - img.height) // 2
        square_img.paste(img, (paste_x, paste_y), img)
        
        # Create a circular mask
        mask = Image.new('L', (size, size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse([0, 0, size, size], fill=255)
        
        # Apply the mask to make it circular
        result = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        result.paste(square_img, (0, 0), mask=mask)
        
        # Save the result
        result.save(output_path, 'PNG')
        print(f"✓ Created {output_path} ({size}x{size})")
        return True
    except Exception as e:
        print(f"✗ Error processing {source_path}: {e}")
        return False

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    icons_dir = os.path.join(parent_dir, 'chrome-extension', 'icons')
    source_path = os.path.join(icons_dir, 'original_icon.png')
    
    if not os.path.exists(source_path):
        print(f"Source file not found: {source_path}")
        return
    
    # Create icons
    sizes = [16, 48, 128]
    for size in sizes:
        output_path = os.path.join(icons_dir, f'icon{size}.png')
        make_circle_icon(source_path, output_path, size)
    
    print("\nDone! All circular icons created successfully.")

if __name__ == '__main__':
    main()
