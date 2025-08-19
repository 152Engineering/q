import { ReactNode } from 'react';
import { useUserAccess } from '@/hooks/useUserAccess';
import AccessRestriction from './AccessRestriction';

interface FlightLimitWrapperProps {
  children: ReactNode;
}

const FlightLimitWrapper = ({ children }: FlightLimitWrapperProps) => {
  const { limits } = useUserAccess();

  return (
    <AccessRestriction
      isAllowed={limits.canAddFlight}
      reason="flight_limit"
      currentCount={limits.currentFlights}
      limit={limits.flightLimit === -1 ? undefined : limits.flightLimit}
    >
      {children}
    </AccessRestriction>
  );
};

export default FlightLimitWrapper;