import { ReactNode } from 'react';
import { useUserAccess } from '@/hooks/useUserAccess';
import AccessRestriction from './AccessRestriction';

interface ToolAccessWrapperProps {
  children: ReactNode;
  toolName: string;
  requiredPlan?: string;
}

const ToolAccessWrapper = ({ children, toolName, requiredPlan }: ToolAccessWrapperProps) => {
  // All authenticated users have access to all tools
  return <>{children}</>;
};

export default ToolAccessWrapper;