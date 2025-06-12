// components/AddExpenseModal.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded: () => void;
}

interface Branch {
  id: string;
  name: string;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onExpenseAdded }) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<Date | undefined>(new Date());
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBranches();
      // Reset form on open
      setAmount('');
      setDescription('');
      setCategory('');
      setExpenseDate(new Date());
      setSelectedBranchId('');
    }
  }, [isOpen]);

  const fetchBranches = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('branches').select('id, name'); // ดึง id และ name ของสาขา
    if (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลสาขาได้: " + error.message,
        variant: "destructive",
      });
    } else {
      setBranches(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!amount || !description || !category || !expenseDate || !selectedBranchId) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "โปรดกรอกข้อมูลค่าใช้จ่ายให้ครบถ้วนและเลือกสาขา",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.from('branch_expenses').insert([
        {
          amount: parseFloat(amount),
          description,
          category,
          expense_date: format(expenseDate, 'yyyy-MM-dd'),
          branch_id: selectedBranchId, // บันทึก branch_id
        },
      ]);

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: "เพิ่มค่าใช้จ่ายสาขาเรียบร้อยแล้ว",
        variant: "success",
      });
      onExpenseAdded(); // เรียกฟังก์ชันนี้เพื่อรีเฟรชข้อมูลในหน้าหลัก
      onClose();
    } catch (error: any) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มค่าใช้จ่ายได้: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>เพิ่มค่าใช้จ่ายสาขา</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              จำนวนเงิน
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              step="0.01"
              min="0"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              รายละเอียด
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              หมวดหมู่
            </Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="expenseDate" className="text-right">
              วันที่
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`col-span-3 justify-start text-left font-normal ${!expenseDate && "text-muted-foreground"}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expenseDate ? format(expenseDate, "PPP") : <span>เลือกวันที่</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={expenseDate}
                  onSelect={setExpenseDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="branch" className="text-right">
              สาขา
            </Label>
            <Select onValueChange={setSelectedBranchId} value={selectedBranchId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="เลือกสาขา" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline" disabled={loading}>
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'กำลังบันทึก...' : 'บันทึกค่าใช้จ่าย'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseModal;