import os
import subprocess

repo_dir = 'C:/Users/Sonny Saggar/.gemini/antigravity/scratch/secret-box'

def build_and_deploy():
    print('--- COMPILED BUILD AND CLOUDFLARE DEPLOY ---')
    
    env = os.environ.copy()
    
    # Prepend repo root, Git Bash bin and Node.js paths
    paths = [
        repo_dir,
        'C:/Program Files/Git/bin',
        'C:/Program Files/nodejs',
        'C:/Windows/System32'
    ]
    env['PATH'] = os.path.pathsep.join(paths + env.get('PATH', '').split(os.path.pathsep))
    env['npm_config_legacy_peer_deps'] = 'true'
    
    # Enable fs symlink bypass for Windows
    env['NODE_OPTIONS'] = '--require C:/Users/Public/patch_fs.js'
    
    # Load credentials from local files
    for env_path in [
        os.path.join(repo_dir, 'secrets', 'api_keys.env'),
        os.path.join(repo_dir, '.env.local'),
        os.path.join(repo_dir, '.env')
    ]:
        if os.path.exists(env_path):
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        parts = line.split('=', 1)
                        env[parts[0].strip()] = parts[1].strip().strip('"').strip("'")
    
    # 1. Run next-on-pages build
    print('Running next-on-pages build command...')
    res_build = subprocess.run(['npx', '@cloudflare/next-on-pages'], cwd=repo_dir, env=env, shell=True)
    if res_build.returncode != 0:
        print('Build failed! Check the build output.')
        return
        
    out_dir = os.path.join(repo_dir, '.vercel', 'output', 'static')
    if os.path.exists(out_dir):
        print('Static output folder generated successfully. Deploying to Cloudflare Pages...')
        
        # 2. Deploy static folder to Cloudflare Pages
        cmd = ['npx', 'wrangler', 'pages', 'deploy', '.vercel/output/static', '--project-name=hive-secretbox', '--branch=main']
        res_deploy = subprocess.run(cmd, cwd=repo_dir, env=env, shell=True)
        if res_deploy.returncode == 0:
            print('DEPLOYMENT SUCCESSFULLY COMPLETED ON CLOUDFLARE PAGES!')
        else:
            print('Deployment failed!')
    else:
        print('Error: Output folder .vercel/output/static was not found.')

if __name__ == '__main__':
    build_and_deploy()
