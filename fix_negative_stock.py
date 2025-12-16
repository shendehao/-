"""
修复负库存数据的脚本
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.inventory.models import Item
from apps.operations.models import InventoryOperation

def fix_negative_stock():
    """修复所有负库存物品"""
    negative_items = Item.objects.filter(stock__lt=0)
    
    print(f"发现 {negative_items.count()} 个负库存物品")
    print("=" * 60)
    
    for item in negative_items:
        print(f"\n物品: {item.name} (ID: {item.id})")
        print(f"当前库存: {item.stock}")
        print(f"最低库存: {item.min_stock}")
        
        # 获取所有操作记录
        operations = InventoryOperation.objects.filter(item=item).order_by('created_at')
        
        if operations.exists():
            print(f"操作记录数: {operations.count()}")
            
            # 重新计算库存
            calculated_stock = 0
            for op in operations:
                if op.operation_type == 'in':
                    calculated_stock += op.quantity
                elif op.operation_type == 'out':
                    calculated_stock -= op.quantity
                print(f"  {op.get_operation_type_display()} {op.quantity} -> 累计: {calculated_stock}")
            
            print(f"根据操作记录计算的库存: {calculated_stock}")
            print(f"实际数据库库存: {item.stock}")
            
            if calculated_stock != item.stock:
                print(f"⚠️  库存不一致！")
                choice = input(f"是否将库存修正为 {calculated_stock}? (y/n): ")
                if choice.lower() == 'y':
                    item.stock = calculated_stock
                    item.save()
                    print(f"✅ 已修正库存为 {calculated_stock}")
        else:
            print("⚠️  没有操作记录！")
            choice = input(f"是否将库存重置为 0? (y/n): ")
            if choice.lower() == 'y':
                item.stock = 0
                item.save()
                print(f"✅ 已重置库存为 0")
    
    print("\n" + "=" * 60)
    print("修复完成！")

if __name__ == '__main__':
    fix_negative_stock()
