#!/usr/bin/env python3
import os
import re
import subprocess
import sys
import glob
import time

def get_current_version(manifest_path):
    with open(manifest_path, 'r') as f:
        content = f.read()
        match = re.search(r'"version":\s*"(\d+\.\d+\.\d+)"', content)
        if match:
            return match.group(1)
    return None

def increment_version(version):
    major, minor, patch = map(int, version.split('.'))
    return f"{major}.{minor}.{patch + 1}"

def update_version_in_file(file_path, pattern, new_version):
    with open(file_path, 'r') as f:
        content = f.read()
    
    new_content = re.sub(pattern, lambda m: m.group(1) + new_version + m.group(3), content)
    
    with open(file_path, 'w') as f:
        f.write(new_content)

def run_command(cmd, cwd=None):
    print(f"Running: {cmd}")
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Error: {result.stderr}")
            return False
        print(result.stdout)
        return True
    except Exception as e:
        print(f"Exception: {e}")
        return False

def wait_and_rename_crx(script_dir, new_version):
    """Wait for .crx file to be created and rename it"""
    print("\n--- Waiting for .crx file ---")
    print("Please package the extension in Chrome now.")
    print("Waiting for chrome-extension.crx to appear...")
    
    max_wait = 300  # 5 minutes
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        crx_files = glob.glob(os.path.join(script_dir, "chrome-extension.crx"))
        if crx_files:
            crx_path = crx_files[0]
            print(f"✓ Found {crx_path}")
            
            # Rename to sellerx-extension.crx
            new_path = os.path.join(script_dir, "sellerx-extension.crx")
            os.rename(crx_path, new_path)
            print(f"✓ Renamed to {new_path}")
            return new_path
        
        # Also check Downloads folder as fallback
        downloads_dir = os.path.expanduser("~/Downloads")
        crx_downloads = glob.glob(os.path.join(downloads_dir, "chrome-extension.crx"))
        if crx_downloads:
            crx_path = crx_downloads[0]
            print(f"✓ Found in Downloads: {crx_path}")
            
            new_path = os.path.join(script_dir, "sellerx-extension.crx")
            os.rename(crx_path, new_path)
            print(f"✓ Moved and renamed to {new_path}")
            return new_path
        
        time.sleep(2)
        print(".", end="", flush=True)
    
    print("\n✗ Timeout waiting for .crx file!")
    return None

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    manifest_path = os.path.join(script_dir, 'chrome-extension', 'manifest.json')
    popup_path = os.path.join(script_dir, 'chrome-extension', 'popup.html')
    update_xml_path = os.path.join(script_dir, 'chrome-extension', 'update.xml')
    
    # Get current version
    current_version = get_current_version(manifest_path)
    if not current_version:
        print("Could not get current version!")
        return
    
    new_version = increment_version(current_version)
    
    print(f"Current version: {current_version}")
    print(f"New version: {new_version}")
    
    confirm = input(f"Do you want to release version {new_version}? (y/n): ")
    if confirm.lower() != 'y':
        print("Release cancelled.")
        return
    
    # Update manifest.json
    update_version_in_file(manifest_path, r'("version":\s*")(\d+\.\d+\.\d+)(")', new_version)
    print("Updated manifest.json")
    
    # Update popup.html
    update_version_in_file(popup_path, r'(版本:\s*)(\d+\.\d+\.\d+)()', new_version)
    print("Updated popup.html")
    
    # Update update.xml
    update_pattern = rf'(version=\')({current_version})(\')'
    update_codebase_pattern = rf'(download/v{current_version}/)'
    with open(update_xml_path, 'r') as f:
        content = f.read()
    content = re.sub(update_pattern, rf'\g<1>{new_version}\g<3>', content)
    content = re.sub(update_codebase_pattern, rf'download/v{new_version}/', content)
    with open(update_xml_path, 'w') as f:
        f.write(content)
    print("Updated update.xml")
    
    # Git operations
    print("\n--- Git operations ---")
    
    # Check git status
    if not run_command("git add -u", cwd=script_dir):
        return
    
    commit_msg = f"Release v{new_version}"
    if not run_command(f'git commit -m "{commit_msg}"', cwd=script_dir):
        return
    
    if not run_command(f'git tag -a v{new_version} -m "v{new_version}"', cwd=script_dir):
        return
    
    if not run_command("git push", cwd=script_dir):
        return
    
    if not run_command(f"git push origin v{new_version}", cwd=script_dir):
        return
    
    print(f"\n🎉 Successfully released v{new_version}!")
    
    # Wait for and handle .crx file
    crx_path = wait_and_rename_crx(script_dir, new_version)
    
    print(f"\n{'='*50}")
    print(f"✅ All steps done! Now go to GitHub:")
    print(f"   https://github.com/1378496782/SellerX/releases/new")
    print(f"\nRelease info:")
    print(f"  Tag version: v{new_version}")
    print(f"  Release title: v{new_version}")
    if crx_path:
        print(f"  File to upload: {crx_path}")
    print(f"{'='*50}")

if __name__ == '__main__':
    main()
