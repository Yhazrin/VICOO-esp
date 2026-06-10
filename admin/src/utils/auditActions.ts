// 审计日志真实动作类型 (zh / en 双向, 供 i18n 文件引用)。
// Order matters: more specific (longer key) appears first so label lookup prefers it.
export const AUDIT_ACTIONS: ReadonlyArray<readonly [string, string, string]> = [
  // 系统
  ['login', 'Login', '登录'],
  ['register', 'Register', '注册'],
  // 用户管理
  ['update_role', 'Update User Role', '修改用户角色'],
  ['update_user_status', 'Update User Status', '修改用户状态'],
  ['modify_user_role', 'Modify User Role (legacy)', '修改用户角色 (旧)'],
  ['update_status', 'Update Status', '更新状态'],
  ['update_profile', 'Update Profile', '更新资料'],
  // 作品 / 投票
  ['submit_artwork', 'Submit Artwork', '提交作品'],
  ['moderate_artwork', 'Moderate Artwork', '审核作品'],
  ['approve_artwork', 'Approve Artwork', '通过作品'],
  ['approve', 'Approve', '通过'],
  ['batch_moderate_artworks', 'Batch Moderate Artworks', '批量审核作品'],
  ['batch_moderate_children', 'Batch Moderate Children', '批量审核儿童'],
  ['review_artwork', 'Review Artwork', '复核作品'],
  ['vote_artwork', 'Vote Artwork', '为作品投票'],
  // 活动
  ['create_campaign', 'Create Campaign', '创建活动'],
  ['create', 'Create', '创建'],
  ['update', 'Update', '更新'],
  // 捐赠
  ['create_donation', 'Create Donation', '创建捐赠'],
  ['complete_donation', 'Complete Donation', '完成捐赠'],
  ['admin_approve_donation', 'Approve Donation (Admin)', '管理员批准捐赠'],
  ['process_donation', 'Process Donation', '处理捐赠'],
  ['allocate_impact_fund', 'Allocate Impact Fund', '拨付公益基金'],
  // 订单
  ['place_order', 'Place Order', '下单'],
  ['cancel_order', 'Cancel Order', '取消订单'],
  ['update_order_status', 'Update Order Status', '更新订单状态'],
  ['confirm_delivery_admin', 'Confirm Delivery (Admin)', '管理员确认发货'],
  ['confirm_receipt_user', 'Confirm Receipt (User)', '用户确认收货'],
  // 支付
  ['create_payment_intent', 'Create Payment Intent', '创建支付'],
  ['payment_callback_success', 'Payment Callback', '支付回调'],
  // 供应链
  ['create_traceability_record', 'Create Traceability Record', '创建溯源节点'],
  ['update_traceability_record', 'Update Traceability Record', '更新溯源节点'],
  ['generate_design', 'Generate Design', '生成设计'],
  ['publish_design_as_product', 'Publish Design as Product', '发布设计为商品'],
  ['publish_product_from_intake', 'Publish Product from Intake', '衣物入库生成商品'],
  ['update_clothing_intake_status', 'Update Clothing Intake Status', '更新衣物入库状态'],
  // AI / 儿童
  ['ai_chat', 'AI Chat', 'AI 对话'],
  ['ai_feedback', 'AI Feedback', 'AI 反馈'],
  ['register_child', 'Register Child', '登记儿童'],
  ['child_consent_approved', 'Approve Child Consent', '批准儿童监护授权'],
  ['view_child_info', 'View Child Info', '查看儿童信息'],
  // 设置 / 数据
  ['modify_settings', 'Modify Settings', '修改设置'],
  ['export_data', 'Export Data', '导出数据'],
  ['delete_data', 'Delete Data', '删除数据'],
];