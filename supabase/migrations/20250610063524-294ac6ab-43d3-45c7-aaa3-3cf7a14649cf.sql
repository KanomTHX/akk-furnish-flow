
-- สร้างตาราง profiles สำหรับข้อมูลผู้ใช้
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'sales', 'cashier', 'credit', 'warehouse', 'manager')),
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้างตาราง customers สำหรับข้อมูลลูกค้า
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  customer_type TEXT NOT NULL DEFAULT 'regular' CHECK (customer_type IN ('regular', 'hire-purchase', 'vip', 'overdue')),
  total_purchases DECIMAL(15,2) DEFAULT 0,
  last_purchase_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้างตาราง products สำหรับสินค้า
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  cost DECIMAL(15,2),
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 5,
  description TEXT,
  brand TEXT,
  model TEXT,
  warranty_months INTEGER DEFAULT 12,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้างตาราง cash_sales สำหรับการขายสด
CREATE TABLE public.cash_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  sales_person_id UUID REFERENCES public.profiles(id),
  cashier_id UUID REFERENCES public.profiles(id),
  subtotal DECIMAL(15,2) NOT NULL,
  discount DECIMAL(15,2) DEFAULT 0,
  tax DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'credit_card', 'qr_code')),
  payment_status TEXT NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'cancelled')),
  receipt_number TEXT,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้างตาราง cash_sale_items สำหรับรายการสินค้าในการขายสด
CREATE TABLE public.cash_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_sale_id UUID REFERENCES public.cash_sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้างตาราง hire_purchase_contracts สำหรับสัญญาเช่าซื้อ
CREATE TABLE public.hire_purchase_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  sales_person_id UUID REFERENCES public.profiles(id),
  credit_officer_id UUID REFERENCES public.profiles(id),
  total_amount DECIMAL(15,2) NOT NULL,
  down_payment DECIMAL(15,2) NOT NULL,
  remaining_amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  installment_months INTEGER NOT NULL,
  monthly_payment DECIMAL(15,2) NOT NULL,
  contract_date DATE NOT NULL,
  first_payment_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้างตาราง hire_purchase_items สำหรับสินค้าในสัญญาเช่าซื้อ
CREATE TABLE public.hire_purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.hire_purchase_contracts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้างตาราง installment_payments สำหรับการชำระค่างวด
CREATE TABLE public.installment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.hire_purchase_contracts(id),
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount_due DECIMAL(15,2) NOT NULL,
  amount_paid DECIMAL(15,2) DEFAULT 0,
  payment_date DATE,
  payment_method TEXT CHECK (payment_method IN ('cash', 'transfer', 'credit_card', 'qr_code')),
  late_fee DECIMAL(15,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partial')),
  receipt_number TEXT,
  cashier_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้างตาราง inventory_movements สำหรับการเคลื่อนไหวสต็อก
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'transfer', 'adjustment')),
  quantity INTEGER NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('purchase', 'sale', 'hire_purchase', 'transfer', 'adjustment')),
  reference_id UUID,
  from_location TEXT,
  to_location TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- เปิดใช้งาน RLS สำหรับทุกตาราง
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hire_purchase_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hire_purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- สร้าง policies สำหรับ profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- สร้าง policies สำหรับ customers (ทุกคนที่ล็อกอินแล้วสามารถเข้าถึงได้)
CREATE POLICY "Authenticated users can manage customers" ON public.customers FOR ALL TO authenticated USING (true);

-- สร้าง policies สำหรับ products
CREATE POLICY "Authenticated users can view products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Warehouse and admin can manage products" ON public.products FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'warehouse'))
);

-- สร้าง policies สำหรับ cash_sales และ items
CREATE POLICY "Authenticated users can manage cash sales" ON public.cash_sales FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage cash sale items" ON public.cash_sale_items FOR ALL TO authenticated USING (true);

-- สร้าง policies สำหรับ hire_purchase และ items
CREATE POLICY "Authenticated users can manage hire purchase" ON public.hire_purchase_contracts FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage hire purchase items" ON public.hire_purchase_items FOR ALL TO authenticated USING (true);

-- สร้าง policies สำหรับ installment_payments
CREATE POLICY "Authenticated users can manage payments" ON public.installment_payments FOR ALL TO authenticated USING (true);

-- สร้าง policies สำหรับ inventory_movements
CREATE POLICY "Authenticated users can view inventory movements" ON public.inventory_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Warehouse and admin can manage inventory" ON public.inventory_movements FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'warehouse'))
);

-- สร้าง function สำหรับ auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- สร้าง triggers สำหรับ auto-update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_hire_purchase_contracts_updated_at BEFORE UPDATE ON public.hire_purchase_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_installment_payments_updated_at BEFORE UPDATE ON public.installment_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- สร้าง function สำหรับสร้าง profile อัตโนมัติเมื่อมีผู้ใช้ใหม่
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'sales'
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- สร้าง trigger สำหรับสร้าง profile อัตโนมัติ
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- เพิ่มข้อมูลตัวอย่าง
INSERT INTO public.products (name, code, category, price, cost, stock_quantity, description, brand) VALUES
('โซฟา 3 ที่นั่ง สีน้ำตาล', 'SF001', 'โซฟา', 25000, 18000, 15, 'โซฟา 3 ที่นั่ง หนังแท้ สีน้ำตาล', 'Home Pro'),
('เตียงนอน 6 ฟุต พร้อมที่นอน', 'BD001', 'เตียง', 35000, 25000, 8, 'เตียงนอนไม้สัก 6 ฟุต พร้อมที่นอนสปริง', 'Sleep Well'),
('ตู้เสื้อผ้า 4 บาน', 'WD001', 'ตู้', 45000, 32000, 12, 'ตู้เสื้อผ้าไม้สัก 4 บาน พร้อมลิ้นชัก', 'Wood Master'),
('โต๊ะทำงาน L-Shape', 'TB001', 'โต๊ะ', 15000, 10000, 20, 'โต๊ะทำงานรูปตัว L พร้อมลิ้นชัก', 'Office Plus'),
('เก้าอี้ผู้บริหาร หนังแท้', 'CH001', 'เก้าอี้', 8000, 5500, 25, 'เก้าอี้ผู้บริหาร หนังแท้ ปรับระดับได้', 'Comfort Zone');
