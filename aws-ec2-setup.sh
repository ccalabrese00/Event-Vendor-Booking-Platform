#!/bin/bash
# AWS EC2 User Data Script for Event Vendor Backend

# Update system
yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install git
yum install -y git

# Install PM2 for process management
npm install -g pm2

# Create app directory
mkdir -p /var/www/app
cd /var/www/app

# Clone the repository (replace with your repo)
git clone https://github.com/ccalabrese00/Event-Vendor-Booking-Platform.git .

# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file (you'll need to update these values)
cat > .env << 'EOF'
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://user:password@localhost:5432/eventvendor
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@eventvendor.com
EOF

# Build the application
npm run build

# Start with PM2
pm2 start dist/index.js --name "event-vendor-api"
pm2 save
pm2 startup systemd

# Install and configure Nginx as reverse proxy
yum install -y nginx

cat > /etc/nginx/conf.d/app.conf << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Remove default nginx config
rm -f /etc/nginx/conf.d/default.conf

# Test and restart nginx
nginx -t
systemctl restart nginx
systemctl enable nginx

echo "Setup complete! App running on port 80 -> 8080"
