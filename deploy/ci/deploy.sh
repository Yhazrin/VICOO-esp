#!/bin/bash
# ============================================
# VICOO — 远程部署脚本
# 通过跳板机部署到 csi420-02-vm8.ucd.ie
# ============================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 部署配置
JUMP_HOST="CS23219620@ipa-rdp.ucd.ie"
VM_HOST="student@csi420-02-vm8.ucd.ie"
APP_DIR="/home/student/vicoo"
DEPLOY_SCRIPT_NAME="deploy.sh"

# Docker配置
REGISTRY="ghcr.io"
IMAGE_PREFIX="tonghua/vicoo"

# 获取Git信息
GIT_SHA="${GIT_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')}"
GIT_BRANCH="${GIT_BRANCH:-$(git branch --show-current 2>/dev/null || echo 'main')}"
DEPLOY_TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"

# 解析命令行参数
ACTION="${1:-deploy}"
ENVIRONMENT="${2:-staging}"

usage() {
    echo "用法: $0 <action> [environment]"
    echo ""
    echo "参数:"
    echo "  action      deploy|rollback|health|logs|restart (默认: deploy)"
    echo "  environment staging|production (默认: staging)"
    echo ""
    echo "环境变量:"
    echo "  GIT_SHA           Git提交SHA"
    echo "  GIT_BRANCH        Git分支名"
    echo "  JUMP_PASSWORD     跳板机密码"
    echo "  VM_PASSWORD       虚拟机密码"
    echo "  DOCKER_REGISTRY   Docker镜像仓库 (默认: ghcr.io)"
    exit 1
}

# 参数验证
if [ "$ACTION" == "help" ] || [ "$ACTION" == "-h" ] || [ "$ACTION" == "--help" ]; then
    usage
fi

if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    log_error "无效的环境: $ENVIRONMENT"
    usage
fi

log_info "========================================"
log_info "VICOO 远程部署脚本"
log_info "========================================"
log_info "操作: $ACTION"
log_info "环境: $ENVIRONMENT"
log_info "Git SHA: $GIT_SHA"
log_info "Git Branch: $GIT_BRANCH"
log_info "部署时间: $DEPLOY_TIMESTAMP"
log_info "========================================"

# 检查必要的环境变量
if [ -z "$JUMP_PASSWORD" ]; then
    log_warn "JUMP_PASSWORD 环境变量未设置，将使用 SSH Agent 或密钥认证"
fi

if [ -z "$VM_PASSWORD" ]; then
    log_warn "VM_PASSWORD 环境变量未设置，将使用 SSH Agent 或密钥认证"
fi

# 创建远程部署脚本内容（将在跳板机上执行）
create_remote_script() {
    local action=$1
    local env=$2

cat << 'REMOTE_SCRIPT'
#!/bin/bash
set -e

APP_DIR="/home/student/vicoo"
REGISTRY="##REGISTRY##"
IMAGE_PREFIX="##IMAGE_PREFIX##"
GIT_SHA="##GIT_SHA##"
ENVIRONMENT="##ENVIRONMENT##"

log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1"
}

cd "$APP_DIR" || {
    log_error "无法进入目录: $APP_DIR"
    exit 1
}

case "##ACTION##" in
    deploy)
        log_info "开始部署 VICOO 到 $ENVIRONMENT 环境..."
        log_info "Git SHA: $GIT_SHA"

        # 拉取最新代码
        log_info "拉取最新代码..."
        git fetch origin
        git checkout main
        git pull origin main

        # 拉取最新Docker镜像
        log_info "拉取最新Docker镜像..."
        docker-compose pull

        # 构建新镜像（如果需要）
        log_info "构建Docker镜像..."
        docker-compose build --pull

        # 停止旧容器
        log_info "停止旧容器..."
        docker-compose down

        # 启动新容器
        log_info "启动新容器..."
        docker-compose up -d

        # 等待服务启动
        log_info "等待服务启动..."
        sleep 10

        # 检查健康状态
        log_info "检查服务健康状态..."
        if curl -sf http://localhost:8000/api/v1/health > /dev/null 2>&1; then
            log_info "Backend 服务健康检查通过"
        else
            log_error "Backend 服务健康检查失败"
            docker-compose logs backend
            exit 1
        fi

        log_info "部署完成!"
        ;;

    rollback)
        log_info "回滚到上一个版本..."
        docker-compose down
        docker-compose pull
        docker-compose up -d
        sleep 10
        log_info "回滚完成!"
        ;;

    health)
        log_info "检查服务健康状态..."
        echo "=== Backend ==="
        curl -sf http://localhost:8000/api/v1/health || echo "Backend 健康检查失败"
        echo ""
        echo "=== Frontend ==="
        curl -sf http://localhost:80 | head -1 || echo "Frontend 健康检查失败"
        echo ""
        echo "=== Docker Containers ==="
        docker-compose ps
        ;;

    logs)
        docker-compose logs -f --tail=100
        ;;

    restart)
        log_info "重启所有服务..."
        docker-compose restart
        sleep 10
        log_info "重启完成!"
        ;;
esac
REMOTE_SCRIPT
}

# 通过跳板机执行远程命令
execute_via_jump() {
    local remote_script="$1"

    log_info "正在通过跳板机连接到虚拟机..."

    # 使用sshpass如果提供了密码，否则使用SSH Agent
    if [ -n "$JUMP_PASSWORD" ]; then
        JUMP_CMD="sshpass -p '$JUMP_PASSWORD' ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -J $JUMP_HOST:$JUMP_PORT $VM_HOST"
    else
        JUMP_CMD="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -J $JUMP_HOST:$JUMP_PORT $VM_HOST"
    fi

    # 创建远程目录（如果不存在）
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -J $JUMP_HOST:$JUMP_PORT $VM_HOST "
        mkdir -p $APP_DIR
        echo '远程目录已确认'
    " || {
        log_error "无法连接到虚拟机"
        exit 1
    }

    # 上传代码到远程
    log_info "同步代码到远程服务器..."
    rsync -avz --exclude='.git' --exclude='node_modules' --exclude='__pycache__' \
        -e "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -J $JUMP_HOST:$JUMP_PORT" \
        ./ $VM_HOST:$APP_DIR/ || {
        log_error "代码同步失败"
        exit 1
    }

    # 创建并执行部署脚本
    log_info "创建远程部署脚本..."

    REMOTE_SCRIPT=$(create_remote_script "$ACTION" "$ENVIRONMENT")
    REMOTE_SCRIPT=$(echo "$REMOTE_SCRIPT" | sed "s/##REGISTRY##/$REGISTRY/g")
    REMOTE_SCRIPT=$(echo "$REMOTE_SCRIPT" | sed "s/##IMAGE_PREFIX##/$IMAGE_PREFIX/g")
    REMOTE_SCRIPT=$(echo "$REMOTE_SCRIPT" | sed "s/##GIT_SHA##/$GIT_SHA/g")
    REMOTE_SCRIPT=$(echo "$REMOTE_SCRIPT" | sed "s/##ENVIRONMENT##/$ENVIRONMENT/g")
    REMOTE_SCRIPT=$(echo "$REMOTE_SCRIPT" | sed "s/##ACTION##/$ACTION/g")

    # 上传部署脚本
    echo "$REMOTE_SCRIPT" | ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -J $JUMP_HOST:$JUMP_PORT $VM_HOST "cat > $APP_DIR/$DEPLOY_SCRIPT_NAME && chmod +x $APP_DIR/$DEPLOY_SCRIPT_NAME"

    # 执行部署脚本
    log_info "执行远程部署脚本..."
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -J $JUMP_HOST:$JUMP_PORT $VM_HOST "cd $APP_DIR && ./$DEPLOY_SCRIPT_NAME"
}

# 主执行流程
main() {
    case "$ACTION" in
        deploy|rollback|restart)
            execute_via_jump
            ;;
        health|logs)
            execute_via_jump
            ;;
        *)
            log_error "未知操作: $ACTION"
            usage
            ;;
    esac
}

main