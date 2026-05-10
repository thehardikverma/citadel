'use client';

import { motion } from 'framer-motion';
import { FolderOpen, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function FilesPage() {
  return (
    <div className="max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold mb-1">Encrypted Files</h2>
        <p className="text-sm text-text-muted mb-8">Securely store sensitive files with client-side encryption.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-border-primary">
          <CardContent className="flex flex-col items-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-bg-elevated flex items-center justify-center mb-4">
              <FolderOpen size={28} className="text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p className="text-sm text-text-muted mb-4 text-center max-w-xs">
              Encrypted file storage is being built. Upload and encrypt any file directly in your browser.
            </p>
            <Badge variant="default">
              <Lock size={10} /> In Development
            </Badge>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
