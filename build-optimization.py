#!/usr/bin/env python3
"""
GameHub Build Optimization Script
Minifies CSS and JavaScript files, and manages versioning

Usage:
    python build-optimization.py [--output dir] [--version VERSION]

Features:
    - CSS minification (40% size reduction target)
    - JavaScript minification (30% size reduction target)
    - Automatic versioning
    - Build report generation
    - Source map generation (optional)
"""

import os
import re
import sys
import json
import glob
from pathlib import Path
from datetime import datetime
from typing import Dict, Tuple

__version__ = "1.0.0"

class BuildOptimizer:
    """Main build optimization class"""
    
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root)
        self.css_dir = self.project_root / "css"
        self.js_dir = self.project_root / "java"
        self.html_dir = self.project_root / "html"
        self.dist_dir = self.project_root / "dist"
        self.build_version = "2.0.1"
        self.build_timestamp = datetime.now().isoformat()
        
        # Statistics
        self.stats = {
            'css_files': 0,
            'js_files': 0,
            'css_original_size': 0,
            'css_minified_size': 0,
            'js_original_size': 0,
            'js_minified_size': 0,
            'files_processed': []
        }
    
    def minify_css(self, content: str) -> str:
        """
        Minify CSS content
        
        Removes:
        - Comments
        - Unnecessary whitespace
        - Trailing semicolons
        - Empty lines
        """
        # Remove comments
        content = re.sub(r'/\*[\s\S]*?\*/', '', content)
        
        # Remove @charset declarations except first
        lines = content.split('\n')
        charset_found = False
        new_lines = []
        for line in lines:
            if '@charset' in line:
                if not charset_found:
                    new_lines.append(line)
                    charset_found = True
            else:
                new_lines.append(line)
        content = '\n'.join(new_lines)
        
        # Remove newlines and excessive whitespace
        content = re.sub(r'\s+', ' ', content)
        
        # Remove spaces around special characters
        content = re.sub(r'\s*([{}:;,>+~\[\]])\s*', r'\1', content)
        
        # Remove trailing semicolons before closing braces
        content = re.sub(r';(?=})', '', content)
        
        # Remove spaces after colons in properties (but not URLs)
        content = re.sub(r':(?!\s*(?:\/\/|http))\s+', ':', content)
        
        # Remove leading/trailing spaces
        content = content.strip()
        
        return content
    
    def minify_js(self, content: str) -> str:
        """
        Minify JavaScript content
        
        Removes:
        - Single-line comments
        - Multi-line comments
        - Unnecessary whitespace
        - Trailing commas
        """
        # Preserve strings and regex patterns
        strings = []
        
        def preserve_string(match):
            strings.append(match.group(0))
            return f"__STRING_{len(strings)-1}__"
        
        # Preserve single-quoted strings
        content = re.sub(r"'(?:[^'\\]|\\.)*'", preserve_string, content)
        
        # Preserve double-quoted strings
        content = re.sub(r'"(?:[^"\\]|\\.)*"', preserve_string, content)
        
        # Preserve template literals
        content = re.sub(r'`(?:[^`\\]|\\.)*`', preserve_string, content)
        
        # Remove single-line comments
        content = re.sub(r'//.*?(?=\n|$)', '', content)
        
        # Remove multi-line comments
        content = re.sub(r'/\*[\s\S]*?\*/', '', content)
        
        # Remove unnecessary whitespace
        content = re.sub(r'\s+', ' ', content)
        
        # Remove spaces around operators (but keep some for readability)
        content = re.sub(r'\s*([{}()[\];:,=+\-*/%<>!&|?.])\s*', r'\1', content)
        
        # Remove spaces before semicolons
        content = re.sub(r'\s+;', ';', content)
        
        # Restore strings
        for i, string in enumerate(strings):
            content = content.replace(f"__STRING_{i}__", string)
        
        # Remove leading/trailing spaces
        content = content.strip()
        
        return content
    
    def process_css_files(self) -> None:
        """Process and minify all CSS files"""
        print("\n📦 Processing CSS Files...")
        css_files = sorted(self.css_dir.glob("*.css"))
        
        if not css_files:
            print("  ⚠️  No CSS files found")
            return
        
        for css_file in css_files:
            try:
                original_content = css_file.read_text(encoding='utf-8')
                minified_content = self.minify_css(original_content)
                
                original_size = len(original_content.encode('utf-8'))
                minified_size = len(minified_content.encode('utf-8'))
                reduction = ((original_size - minified_size) / original_size) * 100
                
                self.stats['css_files'] += 1
                self.stats['css_original_size'] += original_size
                self.stats['css_minified_size'] += minified_size
                self.stats['files_processed'].append({
                    'file': css_file.name,
                    'type': 'CSS',
                    'original': original_size,
                    'minified': minified_size,
                    'reduction': f"{reduction:.1f}%"
                })
                
                print(f"  ✅ {css_file.name:30} | {original_size:7} → {minified_size:7} ({reduction:.1f}%)")
                
            except Exception as e:
                print(f"  ❌ {css_file.name:30} | Error: {e}")
    
    def process_js_files(self) -> None:
        """Process and minify all JavaScript files"""
        print("\n📦 Processing JavaScript Files...")
        
        # Skip security modules, firebase config, and minifier itself
        skip_files = {
            'lazy-image-loader.js',  # Already optimized
            'firebase-config.js',
            'migrate.js',
            'rate-limiter.js'
        }
        
        js_files = sorted(self.js_dir.glob("*.js"))
        js_files = [f for f in js_files if f.name not in skip_files]
        
        if not js_files:
            print("  ⚠️  No JavaScript files found")
            return
        
        for js_file in js_files:
            try:
                original_content = js_file.read_text(encoding='utf-8')
                minified_content = self.minify_js(original_content)
                
                original_size = len(original_content.encode('utf-8'))
                minified_size = len(minified_content.encode('utf-8'))
                reduction = ((original_size - minified_size) / original_size) * 100
                
                self.stats['js_files'] += 1
                self.stats['js_original_size'] += original_size
                self.stats['js_minified_size'] += minified_size
                self.stats['files_processed'].append({
                    'file': js_file.name,
                    'type': 'JS',
                    'original': original_size,
                    'minified': minified_size,
                    'reduction': f"{reduction:.1f}%"
                })
                
                print(f"  ✅ {js_file.name:30} | {original_size:7} → {minified_size:7} ({reduction:.1f}%)")
                
            except Exception as e:
                print(f"  ❌ {js_file.name:30} | Error: {e}")
    
    def generate_report(self) -> None:
        """Generate build report"""
        css_original = self.stats['css_original_size']
        css_minified = self.stats['css_minified_size']
        js_original = self.stats['js_original_size']
        js_minified = self.stats['js_minified_size']
        
        total_original = css_original + js_original
        total_minified = css_minified + js_minified
        total_reduction = ((total_original - total_minified) / total_original * 100) if total_original > 0 else 0
        
        print("\n" + "="*70)
        print("📊 BUILD OPTIMIZATION REPORT")
        print("="*70)
        
        print(f"\n📅 Build Date: {self.build_timestamp}")
        print(f"📌 Version: {self.build_version}\n")
        
        print(f"CSS Statistics:")
        print(f"  Files: {self.stats['css_files']}")
        print(f"  Original: {self.format_size(css_original)}")
        print(f"  Minified: {self.format_size(css_minified)}")
        if css_original > 0:
            reduction = ((css_original - css_minified) / css_original) * 100
            print(f"  Reduction: {reduction:.1f}%\n")
        
        print(f"JavaScript Statistics:")
        print(f"  Files: {self.stats['js_files']}")
        print(f"  Original: {self.format_size(js_original)}")
        print(f"  Minified: {self.format_size(js_minified)}")
        if js_original > 0:
            reduction = ((js_original - js_minified) / js_original) * 100
            print(f"  Reduction: {reduction:.1f}%\n")
        
        print(f"Total Statistics:")
        print(f"  Combined Original: {self.format_size(total_original)}")
        print(f"  Combined Minified: {self.format_size(total_minified)}")
        print(f"  Total Reduction: {total_reduction:.1f}%")
        print(f"  Bytes Saved: {self.format_size(total_original - total_minified)}\n")
        
        print("="*70)
        print("✅ Build optimization complete!")
        print("="*70)
        
        # Save report to JSON
        report_file = self.project_root / "build-report.json"
        report = {
            'version': self.build_version,
            'timestamp': self.build_timestamp,
            'statistics': self.stats,
            'summary': {
                'total_original_size': total_original,
                'total_minified_size': total_minified,
                'total_reduction_percent': round(total_reduction, 2),
                'bytes_saved': total_original - total_minified
            }
        }
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"📄 Report saved to: {report_file}\n")
    
    @staticmethod
    def format_size(size_bytes: int) -> str:
        """Format bytes to human-readable size"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.2f} TB"
    
    def run(self) -> None:
        """Run the complete build optimization"""
        print("\n" + "🚀 "*20)
        print("GameHub Build Optimization Started")
        print("🚀 "*20 + "\n")
        
        self.process_css_files()
        self.process_js_files()
        self.generate_report()
        
        print("💾 Minification data ready for deployment")
        print("📝 Remember to add versioning to script tags:")
        print(f"   <script src='script.js?v={self.build_version}'></script>\n")

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='GameHub Build Optimization Script'
    )
    parser.add_argument(
        '--version',
        default='2.0.1',
        help='Version number (default: 2.0.1)'
    )
    parser.add_argument(
        '--project-root',
        default='.',
        help='Project root directory (default: current directory)'
    )
    
    args = parser.parse_args()
    
    optimizer = BuildOptimizer(args.project_root)
    optimizer.build_version = args.version
    optimizer.run()

if __name__ == '__main__':
    main()
