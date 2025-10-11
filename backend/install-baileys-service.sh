#!/bin/bash

# Install Baileys WhatsApp Service as a system service
# This script creates a launchd service for macOS

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="com.vbsolution.baileys"
PLIST_FILE="$HOME/Library/LaunchAgents/${SERVICE_NAME}.plist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Create LaunchAgents directory if it doesn't exist
mkdir -p "$HOME/Library/LaunchAgents"

# Create the plist file
log "Creating LaunchAgent plist file..."

cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${SERVICE_NAME}</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>${SCRIPT_DIR}/start-baileys.sh</string>
        <string>start</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>${SCRIPT_DIR}</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>${SCRIPT_DIR}/baileys-service.log</string>
    
    <key>StandardErrorPath</key>
    <string>${SCRIPT_DIR}/baileys-service-error.log</string>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
EOF

if [ $? -eq 0 ]; then
    success "LaunchAgent plist file created: $PLIST_FILE"
else
    error "Failed to create plist file"
    exit 1
fi

# Load the service
log "Loading the service..."
launchctl load "$PLIST_FILE"

if [ $? -eq 0 ]; then
    success "Service loaded successfully"
else
    error "Failed to load service"
    exit 1
fi

# Start the service
log "Starting the service..."
launchctl start "$SERVICE_NAME"

if [ $? -eq 0 ]; then
    success "Service started successfully"
else
    error "Failed to start service"
    exit 1
fi

# Show service status
log "Service status:"
launchctl list | grep "$SERVICE_NAME"

echo ""
success "Baileys WhatsApp Service has been installed and started!"
echo ""
echo "Service commands:"
echo "  Check status: launchctl list | grep $SERVICE_NAME"
echo "  Start:        launchctl start $SERVICE_NAME"
echo "  Stop:         launchctl stop $SERVICE_NAME"
echo "  Unload:       launchctl unload $PLIST_FILE"
echo "  Reload:       launchctl unload $PLIST_FILE && launchctl load $PLIST_FILE"
echo ""
echo "Logs:"
echo "  Service logs: $SCRIPT_DIR/baileys-service.log"
echo "  Error logs:   $SCRIPT_DIR/baileys-service-error.log"
echo "  Server logs:  $SCRIPT_DIR/baileys-server.log"
echo ""
echo "The service will automatically start on system boot and restart if it crashes."
