#!/usr/bin/env python3
import os
import zipfile

def build_zip():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    output_path = os.path.join(base_dir, 'public', 'chercher-shop-admin.zip')
    
    if os.path.exists(output_path):
        os.remove(output_path)
        
    exclude_dirs = {'node_modules', '.git', 'dist', '.aistudio', '__pycache__', '.vite'}
    exclude_files = {'chercher-shop-admin.zip'}
    
    file_count = 0
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(base_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.git')]
            for f in files:
                if f in exclude_files or f.endswith('.pyc') or f.endswith('.zip') or f.endswith('.log'):
                    continue
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, base_dir)
                zipf.write(full_path, rel_path)
                file_count += 1
                
    size = os.path.getsize(output_path)
    print(f"Packed {file_count} files into {output_path} ({round(size / 1024, 1)} KB)")

if __name__ == '__main__':
    build_zip()
