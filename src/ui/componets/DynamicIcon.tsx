import React, { lazy, Suspense } from 'react';
import { LucideIconProps } from '@/src/manager/types';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

const fallback = <div style={{ background: '#ddd', width: 24, height: 24 }}/>

const DynamicIcon = React.memo(({ name, ...props }: LucideIconProps) => {
  const LucideIcon = lazy(dynamicIconImports[name]);

  return (
    <Suspense fallback={fallback}>
      <LucideIcon {...props} />
    </Suspense>
  );
});

export default DynamicIcon;