import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// อินเทอร์เฟซสำหรับข้อมูลภูมิศาสตร์ (คัดลอกมาจาก CustomerManagement.tsx เพื่อให้สอดคล้องกัน)
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
  imageUrl?: string; // เพิ่มฟิลด์ imageUrl
}

interface CustomerEditModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void; // Function to trigger data reload in parent
  editingImage: File | null; // For the selected image file
  onImageChange: (file: File | null) => void; // Setter for the image file
  provinces: Province[];
  loadDistricts: (provinceId: string) => Promise<void>;
  loadSubDistricts: (districtId: string) => Promise<void>;
}

const CustomerEditModal: React.FC<CustomerEditModalProps> = ({
  customer,
  isOpen,
  onClose,
  onUpdate,
  editingImage,
  onImageChange,
  provinces,
  loadDistricts,
  loadSubDistricts,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Omit<Customer, 'id'>>({
    customer_type: 'cash',
    name: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subDistricts, setSubDistricts] = useState<SubDistrict[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');


  useEffect(() => {
    if (customer) {
      setFormData({
        customer_type: customer.customer_type,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        province_id: customer.province_id || undefined,
        district_id: customer.district_id || undefined,
        sub_district_id: customer.sub_district_id || undefined,
        zip_code: customer.zip_code || '',
        id_card_number: customer.id_card_number || '',
        occupation: customer.occupation || '',
        income: customer.income || undefined,
        references: customer.references || '',
        notes: customer.notes || '',
        imageUrl: customer.imageUrl || undefined, // Initialize imageUrl
      });
      setSelectedProvinceId(customer.province_id || '');
      setSelectedDistrictId(customer.district_id || '');
    } else {
      // Reset form data when customer is null (modal closed or no customer selected)
      setFormData({
        customer_type: 'cash',
        name: '',
        phone: '',
      });
      setSelectedProvinceId('');
      setSelectedDistrictId('');
      setDistricts([]);
      setSubDistricts([]);
      onImageChange(null); // Reset image state
    }
  }, [customer, isOpen]); // Rerun when customer or isOpen changes

  // Load districts when province changes
  useEffect(() => {
    if (selectedProvinceId) {
      // Assuming loadDistricts updates the districts state internally
      loadDistricts(selectedProvinceId); 
    } else {
      setDistricts([]);
      setSelectedDistrictId('');
    }
  }, [selectedProvinceId, loadDistricts]);

  // Load sub-districts when district changes
  useEffect(() => {
    if (selectedDistrictId) {
      // Assuming loadSubDistricts updates the subDistricts state internally
      loadSubDistricts(selectedDistrictId);
    } else {
      setSubDistricts([]);
      setFormData(prev => ({ ...prev, zip_code: '' }));
    }
  }, [selectedDistrictId, loadSubDistricts]);

  const handleProvinceChange = (provinceId: string) => {
    setSelectedProvinceId(provinceId);
    setFormData(prev => ({ 
      ...prev, 
      province_id: provinceId, 
      district_id: undefined, 
      sub_district_id: undefined, 
      zip_code: undefined 
    }));
  };

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrictId(districtId);
    setFormData(prev => ({ 
      ...prev, 
      district_id: districtId, 
      sub_district_id: undefined, 
      zip_code: undefined 
    }));
  };

  const handleSubDistrictChange = (subDistrictId: string) => {
    const selectedSub = subDistricts.find(sd => sd.id === subDistrictId);
    setFormData(prev => ({ 
      ...prev, 
      sub_district_id: subDistrictId, 
      zip_code: selectedSub?.zip_code || undefined 
    }));
  };


  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    setIsLoading(true);

    try {
      let newImageUrl = formData.imageUrl; // เริ่มต้นด้วย URL รูปภาพเดิมจาก formData

      if (editingImage) {
        // ลบรูปภาพเก่าออกจาก Storage หากมีอยู่และไม่ใช่รูปภาพเริ่มต้น (default image)
        if (formData.imageUrl) {
          // สกัด path ที่ถูกต้องจาก URL รูปภาพ
          // ตัวอย่าง URL: https://[project_ref].supabase.co/storage/v1/object/public/cuspic/customer-images/1700000000-randomstring.png
          // เราต้องการแค่ customer-images/1700000000-randomstring.png
          const urlParts = formData.imageUrl.split('cuspic/');
          let oldFilePathInBucket = '';
          if (urlParts.length > 1) {
            oldFilePathInBucket = urlParts[1];
          }
          
          if (oldFilePathInBucket) {
            const { error: storageError } = await supabase.storage
              .from('cuspic')
              .remove([oldFilePathInBucket]); // ใช้ path ที่สกัดมาได้

            if (storageError) {
              console.error("ข้อผิดพลาดในการลบรูปภาพเก่าจาก Storage:", storageError.message);
              // ไม่จำเป็นต้อง throw error ที่นี่, สามารถดำเนินการต่อไปได้
            }
          }
        }

        const fileExtension = editingImage.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
        const filePath = `customer-images/${fileName}`; // Path ภายใน bucket

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('cuspic') // ชื่อ bucket: cuspic
          .upload(filePath, editingImage, {
            cacheControl: '3600',
            upsert: true, // อนุญาตให้อัปโหลดทับถ้าชื่อไฟล์ซ้ำ (แม้เราจะสร้างชื่อไม่ซ้ำ)
          });

        if (uploadError) {
          throw new Error(`ไม่สามารถอัปโหลดรูปภาพได้: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('cuspic')
          .getPublicUrl(filePath);
        
        newImageUrl = publicUrlData?.publicUrl || null;
      }

      const { error } = await supabase
        .from('customers')
        .update({
          ...formData,
          province_id: selectedProvinceId || null,
          district_id: selectedDistrictId || null,
          sub_district_id: formData.sub_district_id || null, // Ensure sub_district_id is updated
          zip_code: formData.zip_code || null, // Ensure zip_code is updated
          imageUrl: newImageUrl, // อัปเดต URL รูปภาพใหม่
        })
        .eq('id', customer.id);

      if (error) throw error;

      toast({ title: "สำเร็จ", description: "อัปเดตข้อมูลลูกค้าเรียบร้อย" });
      onUpdate(); // Trigger data reload in parent
      onClose(); // Close modal
      onImageChange(null); // Clear selected image after successful update
    } catch (error: any) {
      toast({ 
        title: "ข้อผิดพลาด", 
        description: error.message || "ไม่สามารถอัปเดตข้อมูลลูกค้าได้", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>แก้ไขข้อมูลลูกค้า</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_type">ประเภทลูกค้า *</Label>
              <Select
                value={formData.customer_type}
                onValueChange={(value: 'cash' | 'hire-purchase') => setFormData(prev => ({ ...prev, customer_type: value }))}
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
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="ชื่อลูกค้า"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="เบอร์โทรศัพท์"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="อีเมล"
              />
            </div>
            <div>
                <Label htmlFor="editImage">รูปภาพลูกค้า (เลือกใหม่)</Label>
                <Input
                  id="editImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => onImageChange(e.target.files ? e.target.files[0] : null)}
                />
                {editingImage ? (
                  <p className="text-sm text-slate-500 mt-1">ไฟล์ที่เลือก: {editingImage.name}</p>
                ) : formData.imageUrl ? (
                  <p className="text-sm text-slate-500 mt-1">รูปภาพปัจจุบัน: <a href={formData.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">ดูรูปภาพ</a></p>
                ) : (
                  <p className="text-sm text-slate-500 mt-1">ไม่มีรูปภาพปัจจุบัน</p>
                )}
            </div>
            <div className="col-span-2">
              <Label htmlFor="address">ที่อยู่</Label>
              <Textarea
                id="address"
                value={formData.address || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="บ้านเลขที่, ถนน, ซอย"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="province">จังหวัด</Label>
              <Select
                value={selectedProvinceId}
                onValueChange={handleProvinceChange}
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
                value={selectedDistrictId}
                onValueChange={handleDistrictChange}
                disabled={!selectedProvinceId}
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
                value={formData.sub_district_id || ''}
                onValueChange={handleSubDistrictChange}
                disabled={!selectedDistrictId}
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
                value={formData.zip_code || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                placeholder="รหัสไปรษณีย์"
                disabled // โดยปกติจะ disabled เพราะจะเติมให้อัตโนมัติ
              />
            </div>
            {formData.customer_type === 'hire-purchase' && (
              <>
                <div>
                  <Label htmlFor="id_card_number">เลขบัตรประชาชน</Label>
                  <Input
                    id="id_card_number"
                    value={formData.id_card_number || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, id_card_number: e.target.value }))}
                    placeholder="เลขบัตรประชาชน"
                  />
                </div>
                <div>
                  <Label htmlFor="occupation">อาชีพ</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                    placeholder="อาชีพ"
                  />
                </div>
                <div>
                  <Label htmlFor="income">รายได้ต่อเดือน</Label>
                  <Input
                    id="income"
                    type="number"
                    value={formData.income || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, income: parseFloat(e.target.value) }))}
                    placeholder="รายได้"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="references">บุคคลอ้างอิง</Label>
                  <Textarea
                    id="references"
                    value={formData.references || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, references: e.target.value }))}
                    placeholder="ข้อมูลบุคคลอ้างอิง"
                  />
                </div>
              </>
            )}
            <div className="col-span-2">
              <Label htmlFor="notes">หมายเหตุ</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="หมายเหตุเพิ่มเติม"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              ยกเลิก
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-furniture-500 hover:bg-furniture-600"
            >
              {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerEditModal;