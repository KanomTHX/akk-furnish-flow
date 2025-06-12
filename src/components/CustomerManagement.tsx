import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, Search, Edit, Bell, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CustomerEditModal from './CustomerEditModal'; // ตรวจสอบว่า path ถูกต้อง
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCallback } from 'react';

// อินเทอร์เฟซสำหรับข้อมูลภูมิศาสตร์
interface Province {
  id: string;
  name_th: string;
}

interface District {
  id: string;
  name_th: string;
  province_id: string;
}

interface SubDistrict {
  id: string;
  name_th: string;
  districts_id: string;
  zip_code?: string;
}

interface Customer {
  id: string;
  customer_type: 'cash' | 'hire-purchase';
  name: string;
  phone: string;
  email?: string;
  address?: string;
  province_id?: string;
  district_id?: string;
  sub_district_id?: string;
  zip_code?: string;
  id_card_number?: string;
  occupation?: string;
  income?: number;
  references?: string;
  notes?: string;
  primaryImageUrl?: string | null;
}

const CustomerManagement: React.FC = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subDistricts, setSubDistricts] = useState<SubDistrict[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState<Omit<Customer, 'id'>>({
    customer_type: 'regular',
    name: '',
    phone: '',
    citizen_id: null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [newCustomerImage, setNewCustomerImage] = useState<File | null>(null);
  const [editingCustomerImage, setEditingCustomerImage] = useState<File | null>(null);

  useEffect(() => {
    loadCustomers();
    loadProvinces();
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      loadDistricts(selectedProvince);
    } else {
      setDistricts([]);
      setSelectedDistrict('');
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedDistrict) {
      loadSubDistricts(selectedDistrict);
    } else {
      setSubDistricts([]);
      setNewCustomer(prev => ({ ...prev, zip_code: '' }));
    }
  }, [selectedDistrict]);

   const loadCustomers = useCallback(async () => {
    try {
      // 1. สร้าง Query ด้วยการทำ LEFT JOIN ไปยัง customer_gallery
      let query = supabase.from('customers').select(
        `
        *,
        customer_gallery!left( 
          photo_path,          
          is_primary           
    
        )
        `
      );

      // 2. เพิ่มเงื่อนไขการกรอง (จากโค้ดที่คุณมี)
      // ตัวอย่าง: ถ้าคุณมีการกรองข้อมูลตาม searchTerm, filterType, selectedProvince, selectedDistrict
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }
      if (filterType && filterType !== 'all') {
        query = query.eq('customer_type', filterType);
      }
      if (selectedProvince) {
        query = query.eq('province_id', selectedProvince);
      }
      if (selectedDistrict) {
        query = query.eq('district_id', selectedDistrict);
      }

      // 3. เรียงลำดับข้อมูล
      query = query.order('name'); // เรียงตามชื่อลูกค้า

      // 4. ดำเนินการ Query
      const { data, error } = await query;

      if (error) {
        throw error; // ส่ง error ไปยัง catch block
      }

      // 5. ประมวลผลข้อมูลที่ได้มาเพื่อค้นหารูปภาพหลักและสร้าง URL
      const customersWithImages = data.map((customer: any) => { // ใช้ 'any' ชั่วคราว หรือสร้าง Type ที่เหมาะสมกับการ Join นี้
        let primaryImageUrl: string | null = null;
        let primaryPhotoPath: string | null = null;

        // ตรวจสอบว่ามีข้อมูล customer_gallery ที่ถูก Join มาหรือไม่
        if (customer.customer_gallery && customer.customer_gallery.length > 0) {
          // ค้นหารูปภาพที่ถูกตั้งค่าเป็น is_primary (ถ้ามี)
          const primaryPhoto = customer.customer_gallery.find(
            (photo: { is_primary: boolean; photo_path: string }) => photo.is_primary
          );

          if (primaryPhoto) {
            primaryPhotoPath = primaryPhoto.photo_path;
          } else {
            // ถ้าไม่มีรูปภาพไหนถูกตั้งเป็น is_primary ให้ใช้รูปภาพแรกที่ถูก Join มา
            primaryPhotoPath = customer.customer_gallery[0].photo_path;
          }
        }

        // สร้าง Public URL จาก photo_path ที่ได้มา
        if (primaryPhotoPath) {
          const { data: publicUrlData } = supabase.storage
            .from('customer-gallery') // *** สำคัญ: ต้องตรงกับชื่อ Bucket ของคุณ ***
            .getPublicUrl(primaryPhotoPath);
          primaryImageUrl = publicUrlData?.publicUrl || null;
        }

        // สร้าง Object ลูกค้าใหม่ โดยเพิ่ม primaryImageUrl เข้าไป
        // และลบ customer_gallery ที่ไม่จำเป็นต้องเก็บใน state ออกไป
        const { customer_gallery, ...restCustomerData } = customer;
        return {
          ...restCustomerData,
          primaryImageUrl // เพิ่ม URL รูปภาพหลักเข้าไปใน Object ลูกค้า
        } as Customer; // Cast กลับเป็น Customer Type (ตรวจสอบว่า Customer Type ได้รับการอัปเดตแล้ว)
      });

      setCustomers(customersWithImages); // ตั้งค่า state customers ด้วยข้อมูลใหม่ที่มี URL รูปภาพหลัก

    } catch (error: any) {
      console.error("Error loading customers:", error.message);
      toast({ title: "ข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลลูกค้าได้", variant: "destructive" });
    }
  }, [
    searchTerm,
    filterType,
    selectedProvince,
    selectedDistrict,
    toast, 
    
  ]);

  const loadProvinces = async () => {
    const { data, error } = await supabase
      .from('provinces')
      .select('id, name_th')
      .order('name_th');
    
    if (error) {
      console.error("Error loading provinces:", error);
      return;
    }
    setProvinces(data || []);
  };

  const loadDistricts = async (provinceId: string) => {
    const { data, error } = await supabase
      .from('districts')
      .select('id, name_th, province_id')
      .eq('province_id', provinceId)
      .order('name_th');
    
    if (error) {
      console.error("Error loading districts:", error);
      return;
    }
    setDistricts(data || []);
  };

  const loadSubDistricts = async (districtId: string) => {
    const { data, error } = await supabase
      .from('sub_districts')
      .select('id, name_th, districts_id, zip_code')
      .eq('districts_id', districtId)
      .order('name_th');
    
    if (error) {
      console.error("Error loading sub-districts:", error);
      return;
    }
    setSubDistricts(data || []);
  };

  const addCustomer = async () => {
  // 1. ตรวจสอบข้อมูลที่จำเป็นทั้งหมด รวมถึง citizen_id
  if (
    !newCustomer.name ||
    !newCustomer.phone ||
    !newCustomer.customer_type ||
    !newCustomer.citizen_id // เพิ่มการตรวจสอบ citizen_id ที่นี่
  ) {
    toast({
      title: "ข้อผิดพลาด",
      description: "กรุณากรอกข้อมูลที่จำเป็น: ชื่อ, เลขบัตรประชาชน, เบอร์โทรศัพท์, และประเภทลูกค้า",
      variant: "destructive"
    });
    return;
  }


  if (newCustomer.citizen_id.length !== 13) {
    toast({
      title: "ข้อผิดพลาด",
      description: "เลขบัตรประชาชนต้องมี 13 หลัก",
      variant: "destructive"
    });
    return;
  }
  if (!/^\d+$/.test(newCustomer.citizen_id)) {
    toast({
      title: "ข้อผิดพลาด",
      description: "เลขบัตรประชาชนต้องเป็นตัวเลขเท่านั้น",
      variant: "destructive"
    });
    return;
  }

  let newCustomerId: string | null = null;

  try {
    
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .insert({
        ...newCustomer,
        province_id: selectedProvince || null,
        district_id: selectedDistrict || null
      })
      .select('id')
      .single(); 

    if (customerError) {
      // ตรวจสอบ Unique Constraint Violation สำหรับ citizen_id (ถ้าคุณตั้ง Unique ไว้ใน DB)
      if (customerError.code === '23505' && customerError.message.includes('citizen_id')) {
        throw new Error("เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว กรุณาตรวจสอบอีกครั้ง");
      }
      throw new Error(`ไม่สามารถเพิ่มข้อมูลลูกค้าได้: ${customerError.message}`);
    }

    newCustomerId = customerData.id;


    if (newCustomerImage && newCustomerId) { 
      const fileExtension = newCustomerImage.name.split('.').pop();
      
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
      const filePathInStorage = `customer-images/${newCustomerId}/${fileName}`; // PATH ภายใน bucket

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('customer-gallery') 
        .upload(filePathInStorage, newCustomerImage, {
          cacheControl: '3600',
          upsert: false, 
        });

      if (uploadError) {
        
        await supabase.from('customers').delete().eq('id', newCustomerId); 
        throw new Error(`ไม่สามารถอัปโหลดรูปภาพได้: ${uploadError.message}`);
      }

      
      // ถ้า bucket เป็น public, publicUrl จะเป็นแบบนี้:
      const { data: publicUrlData } = supabase.storage
        .from('customer-gallery')
        .getPublicUrl(filePathInStorage);
      const publicImageUrl = publicUrlData?.publicUrl || null; // URL เต็มสำหรับแสดงผล (ถ้าเป็น public bucket)

      // 3. บันทึกข้อมูลรูปภาพลงใน Table 'customer_gallery'
      const { error: photoInsertError } = await supabase
        .from('customer_gallery') // ชื่อ table ของคุณ
        .insert({
          customer_id: newCustomerId, // ใช้ ID ของลูกค้าที่เพิ่งสร้าง
          photo_path: filePathInStorage, // บันทึก Path ของไฟล์ใน Storage
          is_primary: true, // อาจตั้งเป็น true ถ้าเป็นรูปแรก/รูปหลัก
          caption: `รูปโปรไฟล์ของ ${newCustomer.name}`, // คำอธิบายรูปภาพ
        });

      if (photoInsertError) {
        // หากบันทึกข้อมูลรูปภาพลง DB ล้มเหลว ควรลบไฟล์ที่อัปโหลดไปแล้วใน Storage
        await supabase.storage.from('customer_gallery').remove([filePathInStorage]);
        await supabase.from('customers').delete().eq('id', newCustomerId); // ลบข้อมูลลูกค้า
        throw new Error(`ไม่สามารถบันทึกข้อมูลรูปภาพได้: ${photoInsertError.message}`);
      }
    }

    // 4. แสดงผลสำเร็จและรีเซ็ตค่า
    toast({ title: "สำเร็จ", description: "เพิ่มลูกค้าเรียบร้อย" });
    setIsAddModalOpen(false);
    setNewCustomer({
      customer_type: 'cash', 
      name: '',
      phone: '',
      province_id: null,
      district_id: null,
      citizen_id: null, 
    });
    setSelectedProvince('');
    setSelectedDistrict('');
    setNewCustomerImage(null); 
    loadCustomers(); // โหลดข้อมูลลูกค้าใหม่

  } catch (error: any) {
    console.error("Error in addCustomer:", error); // เพิ่ม console.error เพื่อดู error เต็มๆ
    toast({
      title: "ข้อผิดพลาด",
      description: error.message || "ไม่สามารถเพิ่มลูกค้าได้",
      variant: "destructive"
    });
  }
};

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditModalOpen(true);
    setEditingCustomerImage(null); // เคลียร์รูปภาพที่เลือกไว้ก่อนหน้า
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          customer.phone.includes(searchTerm);
    const matchesType = filterType === 'all' || customer.customer_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Users className="h-6 w-6 text-furniture-500" />
          <h2 className="text-2xl font-bold text-slate-900">จัดการลูกค้า</h2>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-furniture-500 hover:bg-furniture-600">
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มลูกค้าใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>เพิ่มลูกค้าใหม่</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_type">ประเภทลูกค้า *</Label>
                <Select
                  value={newCustomer.customer_type}
                  onValueChange={(value: 'cash' | 'hire-purchase') => setNewCustomer(prev => ({ ...prev, customer_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภทลูกค้า" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">เงินสด</SelectItem>
                    <SelectItem value="hire-purchase">เช่าซื้อ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">ชื่อลูกค้า *</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ชื่อลูกค้า"
                />
              </div>
              <div>
                <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="เบอร์โทรศัพท์"
                />
              </div>
              <div>
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email || ''}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="อีเมล"
                />
              </div>

            <div>
                <Label htmlFor="name">รหัสบัตรประชาชน *</Label>
                <Input
                  id="citizen_id"
                  value={newCustomer.citizen_id}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, citizen_id: e.target.value }))}
                  placeholder="บัตรประชาชน"
                />
              </div>

              <div>
                <Label htmlFor="image">รูปภาพลูกค้า (ไม่บังคับ)</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewCustomerImage(e.target.files ? e.target.files[0] : null)}
                />
                {newCustomerImage && (
                  <p className="text-sm text-slate-500 mt-1">ไฟล์ที่เลือก: {newCustomerImage.name}</p>
                )}
              </div>
              <div className="col-span-2">
                <Label htmlFor="address">ที่อยู่</Label>
                <Textarea
                  id="address"
                  value={newCustomer.address || ''}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="บ้านเลขที่, ถนน, ซอย"
                />
              </div>
              <div>
                <Label htmlFor="province">จังหวัด</Label>
                <Select
                  value={selectedProvince}
                  onValueChange={(value) => {
                    setSelectedProvince(value);
                    setNewCustomer(prev => ({ ...prev, province_id: value, district_id: undefined, sub_district_id: undefined, zip_code: undefined }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกจังหวัด" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map(province => (
                      <SelectItem key={province.id} value={province.id}>{province.name_th}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="district">อำเภอ/เขต</Label>
                <Select
                  value={selectedDistrict}
                  onValueChange={(value) => {
                    setSelectedDistrict(value);
                    setNewCustomer(prev => ({ ...prev, district_id: value, sub_district_id: undefined, zip_code: undefined }));
                  }}
                  disabled={!selectedProvince}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกอำเภอ/เขต" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map(district => (
                      <SelectItem key={district.id} value={district.id}>{district.name_th}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subDistrict">ตำบล/แขวง</Label>
                <Select
                  value={newCustomer.sub_district_id || ''}
                  onValueChange={(value) => {
                    const selectedSub = subDistricts.find(sd => sd.id === value);
                    setNewCustomer(prev => ({ ...prev, sub_district_id: value, zip_code: selectedSub?.zip_code || undefined }));
                  }}
                  disabled={!selectedDistrict}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกตำบล/แขวง" />
                  </SelectTrigger>
                  <SelectContent>
                    {subDistricts.map(subDistrict => (
                      <SelectItem key={subDistrict.id} value={subDistrict.id}>{subDistrict.name_th}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="zip_code">รหัสไปรษณีย์</Label>
                <Input
                  id="zip_code"
                  value={newCustomer.zip_code || ''}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, zip_code: e.target.value }))}
                  placeholder="รหัสไปรษณีย์"
                  disabled // โดยปกติจะ disabled เพราะจะเติมให้อัตโนมัติ
                />
              </div>
              {newCustomer.customer_type === 'hire-purchase' && (
                <>
                  <div>
                    <Label htmlFor="id_card_number">เลขบัตรประชาชน</Label>
                    <Input
                      id="id_card_number"
                      value={newCustomer.id_card_number || ''}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, id_card_number: e.target.value }))}
                      placeholder="เลขบัตรประชาชน"
                    />
                  </div>
                  <div>
                    <Label htmlFor="occupation">อาชีพ</Label>
                    <Input
                      id="occupation"
                      value={newCustomer.occupation || ''}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, occupation: e.target.value }))}
                      placeholder="อาชีพ"
                    />
                  </div>
                  <div>
                    <Label htmlFor="income">รายได้ต่อเดือน</Label>
                    <Input
                      id="income"
                      type="number"
                      value={newCustomer.income || ''}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, income: parseFloat(e.target.value) }))}
                      placeholder="รายได้"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="references">บุคคลอ้างอิง</Label>
                    <Textarea
                      id="references"
                      value={newCustomer.references || ''}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, references: e.target.value }))}
                      placeholder="ข้อมูลบุคคลอ้างอิง"
                    />
                  </div>
                </>
              )}
              <div className="col-span-2">
                <Label htmlFor="notes">หมายเหตุ</Label>
                <Textarea
                  id="notes"
                  value={newCustomer.notes || ''}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="หมายเหตุเพิ่มเติม"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={addCustomer} className="bg-furniture-500 hover:bg-furniture-600">
                เพิ่มลูกค้า
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="ค้นหาลูกค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="ประเภทลูกค้า" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภท</SelectItem>
                <SelectItem value="cash">เงินสด</SelectItem>
                <SelectItem value="hire-purchase">เช่าซื้อ</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการลูกค้า ({filteredCustomers.length} รายการ)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {filteredCustomers.map((customer) => (
  <div key={customer.id} className="border rounded-lg p-4 flex items-start space-x-4">
    {customer.primaryImageUrl && (
      <a
        href={customer.primaryImageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0"
      >
        <img
          src={customer.primaryImageUrl}
          alt={customer.name}
          className="w-20 h-20 object-cover rounded-md"
        />
      </a>
    )}
                <div className="flex-1 flex justify-between">
                  <div>
                    <h3 className="font-medium">{customer.name}</h3>
                    <p className="text-sm text-slate-600">{customer.phone}</p>
                    {customer.email && <p className="text-sm text-slate-600">{customer.email}</p>}
                    {customer.customer_type === 'hire-purchase' && (
                      <Badge variant="secondary" className="mt-1 bg-blue-100 text-blue-800">
                        เช่าซื้อ
                      </Badge>
                    )}
                    {customer.address && (
                      <p className="text-xs text-slate-500 mt-1">{customer.address}, {provinces.find(p => p.id === customer.province_id)?.name_th}</p>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCustomer(customer)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      แก้ไข
                    </Button>
                    {customer.customer_type === 'hire-purchase' && (
                      <>
                        <Button variant="outline" size="sm" className="text-green-600">
                          <CreditCard className="h-4 w-4 mr-1" />
                          รับชำระ
                        </Button>
                        <Button variant="outline" size="sm" className="text-blue-600">
                          <Bell className="h-4 w-4 mr-1" />
                          แจ้งเตือน
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <CustomerEditModal
        customer={editingCustomer}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCustomer(null);
          setEditingCustomerImage(null); // รีเซ็ตเมื่อปิด Modal
        }}
        onUpdate={loadCustomers}
        editingImage={editingCustomerImage}
        onImageChange={setEditingCustomerImage}
        provinces={provinces}
        loadDistricts={loadDistricts}
        loadSubDistricts={loadSubDistricts}
      />
    </div>
  );
};

export default CustomerManagement;