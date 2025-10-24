# Deployment Guide for Logistics Manager Communication Service

## Prerequisites

- Node.js 14+ installed on target server
- Access to all required API credentials
- Server with internet access for external API calls

## Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Copy `.env.sample` to `.env`
- [ ] Configure all API keys and credentials
- [ ] Set correct PORT and NODE_ENV
- [ ] Verify database connections (if any)

### 2. API Credentials Verification
- [ ] Zoho Mail: SMTP credentials and access token
- [ ] WhatsApp: Phone number ID and access token
- [ ] Twilio: Account SID, auth token, phone numbers
- [ ] Telegram: Bot token
- [ ] Fast2SMS: API key and sender ID
- [ ] Karma Tracker: Base URL and API key

### 3. Network Configuration
- [ ] Ensure outbound HTTPS access to all API endpoints
- [ ] Configure firewall for required ports
- [ ] Set up SSL certificates for production

## Deployment Steps

### 1. Server Preparation
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Application Deployment
```bash
# Clone or upload application files
git clone <repository-url> logistics-communication
cd logistics-communication

# Install dependencies
npm install --production

# Configure environment
cp .env.sample .env
# Edit .env with production values
nano .env
```

### 3. Process Management
```bash
# Install PM2 for process management
sudo npm install -g pm2

# Start application with PM2
pm2 start server.js --name "logistics-communication"

# Configure PM2 to start on boot
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs logistics-communication
```

### 4. Nginx Configuration (Optional)
```nginx
# /etc/nginx/sites-available/logistics-communication
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
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
```

### 5. SSL Configuration (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Test renewal
sudo certbot renew --dry-run
```

## Testing Deployment

### 1. Health Check
```bash
curl http://localhost:3000/health
# Should return: {"status":"OK","message":"Logistics Manager Communication Service is running"}
```

### 2. Integration Testing
```bash
# Run integration tests
node integration-test.js
```

### 3. Manual API Testing
```bash
# Test email endpoint
curl -X POST http://localhost:3000/api/communication/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Deployment Test",
    "body": "<h1>Deployment successful!</h1>",
    "type": "transactional",
    "userId": "test-user"
  }'
```

## Monitoring & Maintenance

### 1. Log Monitoring
```bash
# View application logs
pm2 logs logistics-communication

# Monitor resource usage
pm2 monit

# Check system resources
htop
df -h
free -h
```

### 2. Backup Strategy
```bash
# Backup environment configuration
cp .env .env.backup

# Backup application code
tar -czf backup-$(date +%Y%m%d).tar.gz .

# Schedule regular backups with cron
crontab -e
# Add: 0 2 * * * tar -czf /path/to/backups/backup-$(date +\%Y\%m\%d).tar.gz /path/to/app
```

### 3. Update Procedure
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Restart application
pm2 restart logistics-communication

# Verify functionality
curl http://localhost:3000/health
```

## Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check logs
pm2 logs logistics-communication

# Check environment variables
cat .env

# Test Node.js
node -e "console.log('Node.js working')"
```

#### 2. API Calls Failing
```bash
# Test network connectivity
curl -I https://api.zoho.com

# Check API credentials
grep "API_KEY" .env

# Test with curl directly to external APIs
```

#### 3. High Memory Usage
```bash
# Check memory usage
pm2 monit

# Restart if needed
pm2 restart logistics-communication

# Check for memory leaks in code
```

#### 4. Karma Tracker Not Working
```bash
# Test Karma Tracker endpoint directly
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://karma-tracker-api.example.com/api/users/test-user/karma

# Check karmaTracker.js logs
pm2 logs logistics-communication | grep karma
```

## Security Considerations

### 1. Environment Variables
- Never commit `.env` to version control
- Use strong, unique API keys
- Rotate credentials regularly

### 2. Network Security
- Use HTTPS in production
- Configure firewall rules
- Limit SSH access

### 3. Application Security
- Keep dependencies updated
- Use security linters
- Implement rate limiting if needed

## Performance Optimization

### 1. PM2 Clustering
```bash
# Run multiple instances
pm2 start server.js -i max

# Load balancer configuration
pm2 reloadLogs
```

### 2. Caching
- Implement response caching for frequent requests
- Cache external API responses where appropriate

### 3. Database Optimization
- Use connection pooling if applicable
- Implement proper indexing

## Rollback Procedure

```bash
# Stop current version
pm2 stop logistics-communication

# Restore backup
tar -xzf backup-20231001.tar.gz

# Restart with previous version
pm2 start server.js --name "logistics-communication"

# Verify rollback
curl http://localhost:3000/health
```

## Support Contacts

- **Technical Issues**: Development team
- **API Issues**: Check respective provider documentation
- **Infrastructure**: System administrator

## Final Handover Checklist

- [ ] Application deployed and running
- [ ] All API integrations tested
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Monitoring set up
- [ ] Backup strategy implemented
- [ ] Documentation provided
- [ ] Access credentials shared securely
- [ ] Support contacts documented