'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react';
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
          <DialogTitle className="text-black">充值确认</DialogTitle>
          <DialogDescription className="text-gray-500">
            请使用支付宝扫描下方二维码完成支付
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 收款码 */}
          <Card className="border-gray-200 bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* 收款码图片 */}
                <div className="flex-shrink-0">
                  <div className="relative w-48 h-48 mx-auto md:mx-0 border border-gray-200 rounded-lg overflow-hidden">
                    <Image
                      src="/alipay-qrcode.jpg"
                      alt="支付宝收款码"
                      fill
                      className="object-contain bg-white"
                    />
                  </div>
                </div>

                {/* 充值信息 */}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">充值档位</div>
                    <div className="text-xl font-medium text-black">{tierName}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">充值金额</div>
                    <div className="text-3xl font-bold text-black">
                      ¥{price.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">获得积分</div>
                    <div className="text-lg font-medium text-black">
                      {credits} 积分
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                    <ul className="space-y-1 text-gray-700">
                      <li>• 积分充值后永久有效</li>
                      <li>• 积分可以累积使用</li>
                      <li>• 优先使用每月免费额度</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 审核提示 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-blue-900 mb-1">人工审核流程</div>
                  <div className="text-sm text-blue-800">
                    支付完成后，系统将提交充值请求，等待管理员人工审核。审核通过后积分将自动到账。
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 支付凭证上传（推荐） */}
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-black">
                上传支付凭证
                <span className="text-red-500 ml-1">*</span>
              </CardTitle>
              <CardDescription className="text-gray-500">
                请上传支付凭证截图，以便管理员快速审核
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    receiptImage
                      ? 'border-black bg-gray-50'
                      : 'border-gray-300 hover:border-black bg-gray-50'
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
                        <CheckCircle className="w-12 h-12 text-black mx-auto" />
                        <div className="text-sm font-medium text-black">
                          {receiptImage.name}
                        </div>
                        <div className="text-xs text-gray-600">
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
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                    <Image
                      src={previewUrl}
                      alt="支付凭证预览"
                      fill
                      className="object-contain bg-white"
                    />
                  </div>
                )}

                {!receiptImage && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-800">未上传凭证可能导致审核延迟</div>
                      <div className="text-yellow-700 mt-1">
                        请确保上传清晰的支付截图，包含金额和订单号
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              取消
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!receiptImage}
              className="bg-black text-white hover:bg-gray-800 min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              提交审核
            </Button>
          </div>

          {/* 提示信息 */}
          <div className="text-center text-xs text-gray-500">
            提交后，请耐心等待管理员审核，一般 10-30 分钟内完成
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
