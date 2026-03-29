#!/bin/bash
# ============================================
# VICOO — Database Management Script
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database credentials from .env
DB_NAME="${MYSQL_DATABASE:-vicoo}"
DB_USER="${MYSQL_USER:-vicoo}"
DB_PASS="${MYSQL_PASSWORD:-vicoo_pass_2026}"
DB_HOST="localhost"
DB_PORT="3306"

# Container name
CONTAINER_NAME="vicoo-mysql"

# Helper function to run mysql command
run_mysql() {
    docker exec -i "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" 2>/dev/null
}

# Show help
show_help() {
    echo -e "${GREEN}VICOO Database Management${NC}"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  tables              Show all tables"
    echo "  schema <table>      Show table schema"
    echo "  data <table>        Show all data from a table"
    echo "  query <sql>         Run custom SQL query"
    echo "  users               Show all users"
    echo "  products            Show all products"
    echo "  orders              Show all orders"
    echo "  help                Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 tables"
    echo "  $0 schema users"
    echo "  $0 data products"
    echo "  $0 query \"SELECT * FROM users WHERE id = 1\""
}

# Show all tables
cmd_tables() {
    echo -e "${YELLOW}Tables in database:${NC}"
    docker exec -i "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -e "SHOW TABLES;" "$DB_NAME" 2>/dev/null
}

# Show table schema
cmd_schema() {
    local table="$1"
    if [ -z "$table" ]; then
        echo -e "${RED}Error: Please specify table name${NC}"
        echo "Usage: $0 schema <table>"
        exit 1
    fi
    echo -e "${YELLOW}Schema for '$table':${NC}"
    docker exec -i "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -e "DESCRIBE $table;" "$DB_NAME" 2>/dev/null
}

# Show table data
cmd_data() {
    local table="$1"
    if [ -z "$table" ]; then
        echo -e "${RED}Error: Please specify table name${NC}"
        echo "Usage: $0 data <table>"
        exit 1
    fi
    echo -e "${YELLOW}Data from '$table':${NC}"
    docker exec -i "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -e "SELECT * FROM $table;" "$DB_NAME" 2>/dev/null
}

# Run custom query
cmd_query() {
    local sql="$1"
    if [ -z "$sql" ]; then
        echo -e "${RED}Error: Please specify SQL query${NC}"
        echo "Usage: $0 query <sql>"
        exit 1
    fi
    echo -e "${YELLOW}Result:${NC}"
    docker exec -i "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -e "$sql;" "$DB_NAME" 2>/dev/null
}

# Shortcuts
cmd_users() { cmd_data "users"; }
cmd_products() { cmd_data "products"; }
cmd_orders() { cmd_data "orders"; }

# Main
case "$1" in
    tables)
        cmd_tables
        ;;
    schema)
        cmd_schema "$2"
        ;;
    data)
        cmd_data "$2"
        ;;
    query)
        shift
        cmd_query "$*"
        ;;
    users)
        cmd_users
        ;;
    products)
        cmd_products
        ;;
    orders)
        cmd_orders
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        ;;
esac