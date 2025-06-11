
-- เพิ่ม username column ให้ profiles table
ALTER TABLE profiles ADD COLUMN username TEXT UNIQUE;

-- สร้าง storage bucket สำหรับรูปสินค้า
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- สร้างนโยบาย storage สำหรับรูปสินค้า
CREATE POLICY "Allow public read access on product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated users to upload product images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update product images" ON storage.objects
FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete product images" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- เพิ่ม serial_number และ image_url ให้ products table
ALTER TABLE products ADD COLUMN serial_number TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text;
ALTER TABLE products ADD COLUMN image_url TEXT;

-- สร้างตาราง branches (สาขา)
CREATE TABLE branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  manager_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- เพิ่ม branch_id ให้ products table
ALTER TABLE products ADD COLUMN branch_id UUID REFERENCES branches(id);

-- สร้างตาราง product_transfers (การโอนสินค้า)
CREATE TABLE product_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id),
  from_branch_id UUID REFERENCES branches(id),
  to_branch_id UUID NOT NULL REFERENCES branches(id),
  transfer_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  transferred_by UUID REFERENCES profiles(id),
  received_by UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- สร้างตาราง product_history (ประวัติสินค้า)
CREATE TABLE product_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id),
  serial_number TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'created', 'transferred', 'sold', 'returned', 'maintenance'
  action_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  performed_by UUID REFERENCES profiles(id),
  from_branch_id UUID REFERENCES branches(id),
  to_branch_id UUID REFERENCES branches(id),
  reference_id UUID, -- อ้างอิงถึง transaction, transfer, etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- สร้างตาราง expense_categories (หมวดหมู่ค่าใช้จ่าย)
CREATE TABLE expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- เพิ่มข้อมูลหมวดหมู่ค่าใช้จ่ายเริ่มต้น
INSERT INTO expense_categories (name, description) VALUES
('ค่าเช่าสำนักงาน', 'ค่าเช่าพื้นที่สำนักงานและโกดัง'),
('ค่าของใช้สำนักงาน', 'อุปกรณ์และเครื่องใช้สำนักงาน'),
('ค่าอินเทอร์เน็ต', 'ค่าบริการอินเทอร์เน็ตและโทรคมนาคม'),
('ค่าน้ำมัน', 'ค่าน้ำมันเชื้อเพลิงและการขนส่ง'),
('ค่าอุปกรณ์จิปาถะ', 'อุปกรณ์และค่าใช้จ่ายเบ็ดเตล็ด');

-- สร้างตาราง expenses (รายจ่าย)
CREATE TABLE expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES expense_categories(id),
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_number TEXT,
  vendor_name TEXT,
  created_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- เพิ่มสาขาเริ่มต้น
INSERT INTO branches (name, address, phone) VALUES
('สาขาหลัก', 'ที่อยู่สาขาหลัก', '02-xxx-xxxx'),
('สาขาที่ 2', 'ที่อยู่สาขาที่ 2', '02-xxx-xxxy');

-- อัปเดต products ที่มีอยู่ให้มี branch_id เป็นสาขาหลัก
UPDATE products SET branch_id = (SELECT id FROM branches WHERE name = 'สาขาหลัก' LIMIT 1)
WHERE branch_id IS NULL;

-- สร้าง trigger สำหรับ updated_at
CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_transfers_updated_at
  BEFORE UPDATE ON product_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_categories_updated_at
  BEFORE UPDATE ON expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- สร้าง function สำหรับบันทึกประวัติสินค้าอัตโนมัติ
CREATE OR REPLACE FUNCTION log_product_history()
RETURNS TRIGGER AS $$
BEGIN
  -- บันทึกประวัติเมื่อมีการโอนสินค้า
  IF TG_TABLE_NAME = 'product_transfers' AND NEW.status = 'completed' THEN
    INSERT INTO product_history (
      product_id, serial_number, action_type, performed_by, 
      from_branch_id, to_branch_id, reference_id, notes
    ) VALUES (
      NEW.product_id, 
      (SELECT serial_number FROM products WHERE id = NEW.product_id),
      'transferred', 
      NEW.transferred_by, 
      NEW.from_branch_id, 
      NEW.to_branch_id, 
      NEW.id, 
      NEW.notes
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- สร้าง trigger สำหรับบันทึกประวัติ
CREATE TRIGGER product_transfer_history_trigger
  AFTER UPDATE ON product_transfers
  FOR EACH ROW
  EXECUTE FUNCTION log_product_history();

-- Enable RLS สำหรับตารางใหม่
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- สร้างนโยบาย RLS (เริ่มต้นให้ authenticated users เข้าถึงได้ทั้งหมด)
CREATE POLICY "Allow authenticated users full access to branches" ON branches
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to product_transfers" ON product_transfers
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to product_history" ON product_history
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to expense_categories" ON expense_categories
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to expenses" ON expenses
FOR ALL USING (auth.role() = 'authenticated');
