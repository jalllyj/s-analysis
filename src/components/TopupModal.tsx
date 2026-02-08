'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface TopupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tierId: string;
  tierName: string;
  credits: number;
  price: number;
  onConfirm: (receiptImage?: File) => void;
}

export default function TopupModal({
  open,
  onOpenChange,
  tierId,
  tierName,
  credits,
  price,
  onConfirm,
}: TopupModalProps) {
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReceiptImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleConfirm = () => {
    onConfirm(receiptImage || undefined);
    onOpenChange(false);
    setReceiptImage(null);
    setPreviewUrl('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>充值确认</DialogTitle>
          <DialogDescription>
            请使用支付宝扫描下方二维码完成支付
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 收款码 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* 收款码图片 */}
                <div className="flex-shrink-0">
                  <div className="relative w-48 h-48 mx-auto md:mx-0">
                    <Image
                      src="/alipay-qrcode.jpg"
                      alt="支付宝收款码"
                      fill
                      className="object-contain rounded-lg"
                    />
                  </div>
                </div>

                {/* 充值信息 */}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">充值档位</div>
                    <div className="text-2xl font-bold">{tierName}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">充值金额</div>
                    <div className="text-3xl font-bold text-blue-600">
                      ¥{price.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">获得积分</div>
                    <div className="text-xl font-semibold">
                      {credits} 积分（可分析 {credits} 只股票）
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2 text-sm text-blue-800">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <ul className="space-y-1">
                        <li>• 积分充值后永久有效</li>
                        <li>• 积分可以累积使用</li>
                        <li>• 优先使用每月免费额度</li>
                        <li>• 免费额度用完后自动扣除积分</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 支付凭证上传（可选） */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">上传支付凭证（可选）</CardTitle>
              <CardDescription>
                为了更快到账，建议上传支付凭证截图
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    receiptImage
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <label htmlFor="receipt-upload" className="cursor-pointer">
                    {receiptImage ? (
                      <div className="space-y-2">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                        <div className="text-sm font-medium text-green-700">
                          {receiptImage.name}
                        </div>
                        <div className="text-xs text-green-600">
                          点击更换图片
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                        <div className="text-sm font-medium text-gray-700">
                          点击或拖拽上传支付凭证
                        </div>
                        <div className="text-xs text-gray-500">
                          支持 JPG、PNG 格式
                        </div>
                      </div>
                    )}
                  </label>
                </div>

                {previewUrl && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                    <Image
                      src={previewUrl}
                      alt="支付凭证预览"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleConfirm} className="min-w-[120px]">
              确认已支付
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
