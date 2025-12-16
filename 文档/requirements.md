# 需求文档

## 简介

库存调拨功能允许用户在不同仓库之间转移物品库存。该功能是库存管理系统的核心组成部分，用于优化库存分布、平衡各仓库存量、满足不同仓库的物品需求。系统需要确保调拨过程中的数据一致性，防止库存数据错误。

## 术语表

- **调拨系统 (Transfer_System)**: 负责处理仓库间物品转移的子系统
- **源仓库 (Source_Warehouse)**: 物品调出的仓库
- **目标仓库 (Target_Warehouse)**: 物品调入的仓库
- **调拨记录 (Transfer_Record)**: 记录一次调拨操作的完整信息
- **调拨数量 (Transfer_Quantity)**: 本次调拨的物品数量
- **物品 (Item)**: 库存管理系统中的物品实体
- **操作员 (Operator)**: 执行调拨操作的用户

## 需求

### 需求 1

**用户故事:** 作为仓库管理员，我希望能够创建新的调拨单，以便将物品从一个仓库转移到另一个仓库。

#### 验收标准

1. WHEN 用户提交调拨请求时 THEN Transfer_System SHALL 验证源仓库中该物品的库存数量是否大于或等于调拨数量
2. WHEN 调拨请求通过验证时 THEN Transfer_System SHALL 从源仓库扣减指定数量的库存
3. WHEN 调拨请求通过验证时 THEN Transfer_System SHALL 向目标仓库增加指定数量的库存
4. WHEN 调拨操作完成时 THEN Transfer_System SHALL 创建一条包含物品、数量、源仓库、目标仓库、操作员和时间戳的调拨记录
5. IF 源仓库库存不足 THEN Transfer_System SHALL 拒绝调拨请求并返回明确的错误信息

### 需求 2

**用户故事:** 作为仓库管理员，我希望能够查看调拨记录列表，以便追踪和审计物品的流转情况。

#### 验收标准

1. WHEN 用户访问调拨记录页面时 THEN Transfer_System SHALL 显示按时间倒序排列的调拨记录列表
2. WHEN 显示调拨记录时 THEN Transfer_System SHALL 展示物品名称、调拨数量、源仓库名称、目标仓库名称、操作员姓名和操作时间
3. WHEN 用户按物品名称搜索时 THEN Transfer_System SHALL 返回包含该关键词的调拨记录
4. WHEN 用户按时间范围筛选时 THEN Transfer_System SHALL 返回该时间段内的调拨记录
5. WHEN 调拨记录数量超过单页显示限制时 THEN Transfer_System SHALL 提供分页功能

### 需求 3

**用户故事:** 作为仓库管理员，我希望在创建调拨单时能够选择物品和仓库，以便快速准确地完成调拨操作。

#### 验收标准

1. WHEN 用户打开新增调拨表单时 THEN Transfer_System SHALL 显示可选择的物品下拉列表
2. WHEN 用户选择物品后 THEN Transfer_System SHALL 显示该物品当前所在仓库及库存数量
3. WHEN 用户选择源仓库后 THEN Transfer_System SHALL 在目标仓库列表中排除源仓库
4. WHEN 用户输入调拨数量时 THEN Transfer_System SHALL 实时验证数量是否超过源仓库可用库存
5. WHEN 表单数据不完整时 THEN Transfer_System SHALL 禁用提交按钮并提示必填字段

### 需求 4

**用户故事:** 作为系统管理员，我希望调拨操作保持数据一致性，以便确保库存数据的准确性。

#### 验收标准

1. WHEN 调拨操作执行时 THEN Transfer_System SHALL 在单个数据库事务中完成源仓库扣减和目标仓库增加
2. IF 调拨过程中发生错误 THEN Transfer_System SHALL 回滚所有更改并保持原有库存状态
3. WHEN 调拨完成后 THEN Transfer_System SHALL 更新物品的仓库归属信息
4. WHEN 调拨导致源仓库库存低于最低库存时 THEN Transfer_System SHALL 更新物品状态为低库存

### 需求 5

**用户故事:** 作为仓库管理员，我希望能够查看调拨统计信息，以便了解仓库间的物品流转情况。

#### 验收标准

1. WHEN 用户查看调拨统计时 THEN Transfer_System SHALL 显示指定时间段内的调拨总次数
2. WHEN 用户查看调拨统计时 THEN Transfer_System SHALL 显示指定时间段内的调拨物品总数量
3. WHEN 用户查看调拨统计时 THEN Transfer_System SHALL 显示各仓库的调入和调出数量汇总
