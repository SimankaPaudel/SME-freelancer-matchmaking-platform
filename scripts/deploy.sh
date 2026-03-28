#!/bin/bash

# Production Deployment Script
# Usage: ./scripts/deploy.sh [start|stop|restart|logs|health]

set -e

COMMAND=${1:-start}
PROJECT_NAME="fyp"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   Freelance Platform - Deployment Script${NC}"
echo -e "${GREEN}================================================${NC}\n"

case $COMMAND in
  start)
    echo -e "${YELLOW}▶ Starting all services...${NC}"
    docker-compose up -d
    sleep 3
    echo -e "${GREEN}✓ Services started${NC}"
    echo ""
    ./scripts/deploy.sh health
    ;;
    
  stop)
    echo -e "${YELLOW}▶ Stopping all services...${NC}"
    docker-compose down
    echo -e "${GREEN}✓ Services stopped${NC}"
    ;;
    
  restart)
    echo -e "${YELLOW}▶ Restarting all services...${NC}"
    docker-compose restart
    sleep 2
    echo -e "${GREEN}✓ Services restarted${NC}"
    echo ""
    ./scripts/deploy.sh health
    ;;
    
  rebuild)
    echo -e "${YELLOW}▶ Rebuilding containers...${NC}"
    docker-compose build --no-cache
    docker-compose up -d
    sleep 3
    echo -e "${GREEN}✓ Containers rebuilt and started${NC}"
    echo ""
    ./scripts/deploy.sh health
    ;;
    
  logs)
    SERVICE=${2:-all}
    if [ "$SERVICE" = "all" ]; then
      docker-compose logs -f
    else
      docker-compose logs -f $SERVICE
    fi
    ;;
    
  health)
    echo -e "${YELLOW}▶ Checking service health...${NC}"
    echo ""
    
    # Check docker daemon
    if ! docker ps > /dev/null 2>&1; then
      echo -e "${RED}✗ Docker daemon not running${NC}"
      exit 1
    fi
    
    # Check containers status
    echo -e "${YELLOW}Container Status:${NC}"
    docker-compose ps
    echo ""
    
    # Check backend health
    echo -e "${YELLOW}Backend Health:${NC}"
    if curl -s http://localhost:5000/health > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Backend: Healthy${NC}"
    else
      echo -e "${RED}✗ Backend: Unhealthy${NC}"
    fi
    
    # Check frontend health
    echo -e "${YELLOW}Frontend Health:${NC}"
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Frontend: Healthy${NC}"
    else
      echo -e "${RED}✗ Frontend: Unhealthy${NC}"
    fi
    
    # Check database connection
    echo -e "${YELLOW}Database Status:${NC}"
    if docker-compose exec -T mongodb mongosh -u admin -p password --eval "db.runCommand('ping')" > /dev/null 2>&1; then
      echo -e "${GREEN}✓ MongoDB: Connected${NC}"
    else
      echo -e "${RED}✗ MongoDB: Connection failed${NC}"
    fi
    ;;
    
  backup)
    echo -e "${YELLOW}▶ Creating database backup...${NC}"
    BACKUP_DIR="backups/$(date +%Y-%m-%d_%H-%M-%S)"
    mkdir -p $BACKUP_DIR
    docker-compose exec -T mongodb mongodump -u admin -p password -o /tmp/dump
    docker cp fyp-mongodb:/tmp/dump $BACKUP_DIR/mongodb
    echo -e "${GREEN}✓ Backup created: $BACKUP_DIR${NC}"
    ;;
    
  restore)
    if [ -z "$2" ]; then
      echo -e "${RED}✗ Usage: ./scripts/deploy.sh restore <backup-path>${NC}"
      exit 1
    fi
    echo -e "${YELLOW}▶ Restoring database from: $2${NC}"
    docker cp $2/mongodb fyp-mongodb:/tmp/dump
    docker-compose exec -T mongodb mongorestore -u admin -p password /tmp/dump
    echo -e "${GREEN}✓ Database restored${NC}"
    ;;
    
  stats)
    echo -e "${YELLOW}▶ Container Statistics${NC}"
    docker stats --no-stream $PROJECT_NAME-*
    ;;
    
  shell)
    SERVICE=${2:-backend}
    echo -e "${YELLOW}▶ Opening shell to $SERVICE...${NC}"
    docker-compose exec $SERVICE sh
    ;;
    
  purge)
    echo -e "${RED}⚠ WARNING: This will delete all containers, volumes, and data!${NC}"
    read -p "Are you sure? (type 'yes' to confirm): " CONFIRM
    if [ "$CONFIRM" = "yes" ]; then
      echo -e "${YELLOW}▶ Purging all services...${NC}"
      docker-compose down -v
      echo -e "${GREEN}✓ All services and volumes removed${NC}"
    else
      echo -e "${YELLOW}Purge cancelled${NC}"
    fi
    ;;
    
  *)
    echo -e "${YELLOW}Usage: ./scripts/deploy.sh [COMMAND]${NC}"
    echo ""
    echo "Commands:"
    echo "  start         - Start all services"
    echo "  stop          - Stop all services"
    echo "  restart       - Restart all services"
    echo "  rebuild       - Rebuild and start services"
    echo "  logs          - View service logs (use: logs [service])"
    echo "  health        - Check service health"
    echo "  backup        - Create database backup"
    echo "  restore       - Restore database backup (use: restore <path>)"
    echo "  stats         - View container statistics"
    echo "  shell         - Open shell to service (use: shell [service])"
    echo "  purge         - Delete all containers and volumes"
    echo ""
    echo "Examples:"
    echo "  ./scripts/deploy.sh start"
    echo "  ./scripts/deploy.sh logs backend"
    echo "  ./scripts/deploy.sh shell backend"
    echo "  ./scripts/deploy.sh health"
    ;;
esac

echo ""
