#!/usr/bin/env python3
from PIL import Image
import os

def resize_icon(input_path, output_path, size):
    try:
        img = Image.open(input_path)
        img_resized = img.resize((size, size), Image.Resampling.LANCZOS)
        img_resized.save(output_path, 'PNG')
        print(f"✓ Created {output_path} ({size}x{size})")
    except Exception as e:
        print(f"✗ Error processing {input_path}: {e}")

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    icons_dir = os.path.join(script_dir, 'chrome-extension', 'icons')
    
    # Find any PNG file in icons dir as source
    source_files = [f for f in os.listdir(icons_dir) if f.endswith('.png')]
    
    if not source_files:
        print("No PNG files found in icons directory!")
        return
    
    # Use the largest available icon as source
    source_file = None
    max_size = 0
    for f in source_files:
        try:
            img = Image.open(os.path.join(icons_dir, f))
            if img.size[0] > max_size:
                max_size = img.size[0]
                source_file = f
        except:
            pass
    
    if not source_file:
        print("Could not find a valid source image!")
        return
    
    source_path = os.path.join(icons_dir, source_file)
    print(f"Using {source_file} as source image")
    
    # Resize to required sizes
    sizes = [16, 48, 128]
    for size in sizes:
        output_path = os.path.join(icons_dir, f'icon{size}.png')
        resize_icon(source_path, output_path, size)
    
    print("\nDone! All icons resized successfully.")

if __name__ == '__main__':
    main()
