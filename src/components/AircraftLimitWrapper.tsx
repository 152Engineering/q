import { ReactNode } from 'react';
import { useUserAccess } from '@/hooks/useUserAccess';
import AccessRestriction from './AccessRestriction';

interface AircraftLimitWrapperProps {
  children: ReactNode;
}

const AircraftLimitWrapper = ({ children }: AircraftLimitWrapperProps) => {
  const { limits } = useUserAccess();

  return (
    <AccessRestriction
      isAllowed={limits.canAddAircraft}
      reason="aircraft_limit"
      currentCount={limits.currentAircraft}
      limit={limits.aircraftLimit === -1 ? undefined : limits.aircraftLimit}
    >
      {children}
    </AccessRestriction>
  );
};

export default AircraftLimitWrapper;