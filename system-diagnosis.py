# System Diagnosis and Fix Script

import os
import sys
import subprocess
import json
from pathlib import Path

def run_command(command, shell=True):
    """Run a command and return the result"""
    try:
        result = subprocess.run(command, shell=shell, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def check_system_status():
    """Check the overall system status"""
    print("🔍 Advanced Crypto Monitor - System Diagnosis")
    print("=" * 50)
    
    # Check if we're in the right directory
    current_dir = Path.cwd()
    print(f"\n📂 Current directory: {current_dir}")
    
    # Check for required files
    required_files = [
        'advanced-crypto-monitor.js',
        'crypto-project-monitor.js',
        'crypto_analyzer.py',
        'dark_web_monitor.py',
        'config_manager.py',
        'package.json',
        '.env'
    ]
    
    print("\n📁 Required files check:")
    missing_files = []
    for file in required_files:
        exists = Path(file).exists()
        size = Path(file).stat().st_size if exists else 0
        status = "✅" if exists else "❌"
        print(f"   {status} {file} {'('+str(round(size/1024))+'KB)' if exists else ''}")
        if not exists:
            missing_files.append(file)
    
    if missing_files:
        print(f"\n⚠️ Missing files: {', '.join(missing_files)}")
        return False
    
    # Check Git status
    print("\n🌐 Git repository status:")
    success, output, error = run_command("git status --porcelain")
    if success:
        if output.strip():
            print("📝 Uncommitted changes found:")
            for line in output.strip().split('\n'):
                print(f"   📄 {line}")
        else:
            print("✅ No uncommitted changes")
    else:
        print("❌ Git status check failed:", error)
    
    # Check if server is running
    print("\n🚀 Server status check:")
    try:
        import requests
        
        ports = [3000, 3001, 3002]
        for port in ports:
            try:
                response = requests.get(f"http://localhost:{port}/api/status", timeout=2)
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Server running on port {port}")
                    print(f"   Status: {data.get('status', 'unknown')}")
                    if 'seenProjects' in data:
                        print(f"   Projects: {data['seenProjects']}")
                else:
                    print(f"⚠️ Server responding but status {response.status_code} on port {port}")
            except requests.exceptions.ConnectionError:
                print(f"❌ No server on port {port}")
            except Exception as e:
                print(f"⚠️ Error checking port {port}: {e}")
                
    except ImportError:
        print("⚠️ requests module not available for server check")
    
    # Check Node.js and Python
    print("\n🔧 Runtime environment:")
    
    # Node.js check
    success, output, error = run_command("node --version")
    if success:
        print(f"✅ Node.js: {output.strip()}")
    else:
        print("❌ Node.js not found")
    
    # Python check
    print(f"✅ Python: {sys.version}")
    
    # Check environment variables
    print("\n🔑 Environment variables:")
    env_vars = ['CMC_API_KEY', 'GITHUB_TOKEN', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID']
    for var in env_vars:
        value = os.getenv(var)
        if value and not value.startswith('your_'):
            print(f"✅ {var}: Configured")
        else:
            print(f"⚠️ {var}: Not configured")
    
    return True

def fix_common_issues():
    """Fix common issues"""
    print("\n🔧 Fixing common issues...")
    
    # Create missing directories
    dirs_to_create = ['logs', 'data', 'backups', 'exports', 'public']
    for dir_name in dirs_to_create:
        Path(dir_name).mkdir(exist_ok=True)
        print(f"✅ Created directory: {dir_name}")
    
    # Check and fix package.json scripts
    if Path('package.json').exists():
        with open('package.json', 'r') as f:
            package_data = json.load(f)
        
        # Ensure proper scripts
        required_scripts = {
            "start": "node advanced-crypto-monitor.js",
            "dev": "NODE_ENV=development node advanced-crypto-monitor.js",
            "monitor": "node crypto-project-monitor.js",
            "setup": "python setup.py",
            "status": "curl http://localhost:3000/api/status"
        }
        
        if 'scripts' not in package_data:
            package_data['scripts'] = {}
        
        updated = False
        for script, command in required_scripts.items():
            if package_data['scripts'].get(script) != command:
                package_data['scripts'][script] = command
                updated = True
        
        if updated:
            with open('package.json', 'w') as f:
                json.dump(package_data, f, indent=2)
            print("✅ Updated package.json scripts")
    
def generate_update_commands():
    """Generate commands to update GitHub"""
    print("\n📤 GitHub Update Commands:")
    print("-" * 30)
    
    commands = [
        "# Check current status",
        "git status",
        "",
        "# Add all files", 
        "git add .",
        "",
        "# Commit changes",
        'git commit -m "Update Advanced Crypto Monitor System with complete features"',
        "",
        "# Push to GitHub",
        "git push origin main",
        "",
        "# If you get permission errors, check your credentials:",
        "git config --global user.name \"Your Name\"",
        "git config --global user.email \"your.email@example.com\"",
        "",
        "# Alternative: Force push if needed (BE CAREFUL)",
        "# git push --force-with-lease origin main"
    ]
    
    for cmd in commands:
        print(cmd)
    
    # Save commands to file
    with open('github-update-commands.txt', 'w') as f:
        f.write('\n'.join(commands))
    print(f"\n💾 Commands saved to: github-update-commands.txt")

def main():
    """Main function"""
    if check_system_status():
        fix_common_issues()
        generate_update_commands()
        
        print("\n🎉 System diagnosis completed!")
        print("\n🚀 Next steps:")
        print("1. Run: ./update-github.bat (Windows) or ./update-github.sh (Linux/Mac)")
        print("2. Or manually run the commands from github-update-commands.txt")
        print("3. Check your repository: https://github.com/Nagesh00/cryptomarket-info")
        print("4. Access dashboard: http://localhost:3000")
    else:
        print("\n❌ System has issues that need to be resolved first")

if __name__ == "__main__":
    main()
