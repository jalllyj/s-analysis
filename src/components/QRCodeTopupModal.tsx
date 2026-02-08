'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface QRCodeTopupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tierId: string;
  tierName: string;
  credits: number;
  price: number;
  onConfirm: (receiptFileKey: string) => Promise<void>;
}

export default function QRCodeTopupModal({
  open,
  onOpenChange,
  tierId,
  tierName,
  credits,
  price,
  onConfirm,
}: QRCodeTopupModalProps) {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        alert('请上传图片文件');
        return;
      }
      setReceiptFile(selectedFile);
    }
  };

  const handleUploadReceipt = async () => {
    if (!receiptFile) {
      alert('请选择支付凭证');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', receiptFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('上传失败');
      }

      const uploadData = await uploadResponse.json();
      await onConfirm(uploadData.fileKey);
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!receiptFile) {
      alert('请上传支付凭证');
      return;
    }

    setIsSubmitting(true);
    try {
      await handleUploadReceipt();
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>扫码充值</DialogTitle>
          <DialogDescription>
            扫码支付后上传凭证，管理员审核后增加积分
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 充值档位信息 */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">充值档位</span>
              <span className="font-medium text-black">{tierName}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">充值金额</span>
              <span className="font-medium text-black">¥{price}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">获得积分</span>
              <span className="font-medium text-black">{credits} 积分</span>
            </div>
          </div>

          {/* 收款码 */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">请使用微信或支付宝扫描下方收款码</p>
            <div className="inline-block p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <img
                src="/qrcode.jpg"
                alt="收款码"
                className="w-48 h-48 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-4">
              请确保支付金额与充值金额一致
            </p>
          </div>

          {/* 上传支付凭证 */}
          <div>
            <Label htmlFor="receipt" className="text-sm font-medium">
              上传支付凭证 <span className="text-red-500">*</span>
            </Label>
            <div className="mt-2">
              <Input
                ref={fileInputRef}
                id="receipt"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                disabled={isUploading || isSubmitting}
              >
                <Upload className="w-4 h-4 mr-2" />
                {receiptFile ? receiptFile.name : '选择支付凭证图片'}
              </Button>
            </div>
          </div>

          {/* 提示信息 */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">充值说明：</p>
              <ul className="list-disc list-inside space-y-1">
                <li>扫码支付后，请截图保存支付凭证</li>
                <li>上传支付凭证后，管理员会在1-2小时内审核</li>
                <li>审核通过后，积分会自动增加到您的账户</li>
                <li>如有问题，请联系客服</li>
              </ul>
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              type="button"
              className="flex-1 bg-black text-white hover:bg-gray-800"
              onClick={handleSubmit}
              disabled={!receiptFile || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  提交中...
                </>
              ) : (
                '提交审核'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
