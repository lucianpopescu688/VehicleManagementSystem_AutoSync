import React, { useEffect, useState } from 'react';
import Card from '../components/Card/Card';
import { vehicleService } from '../services/vehicleService';
import type { Vehicle } from '../services/vehicleService';

const PlaceholderDashboard: React.FC<{ role: string }> = ({ role }) => {
  return (
    <div style={{ padding: '2rem' }}>
      <p className="label-md" style={{ opacity: 0.5, marginBottom: '0.5rem' }}>Dashboard</p>
      <h1 className="display-lg">{role}</h1>
      <Card elevation="low" style={{ marginTop: '2rem' }}>
        <p className="body-md">This view is currently being optimized for technical mastery.</p>
      </Card>
    </div>
  );
};

export const DriverDashboard = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        // Since we don't have the real ID, we'll fetch all and filter for the demo
        // or just show a message. Let's try to fetch all for the demo.
        const data = await vehicleService.listAll();
        setVehicles(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <p className="label-md" style={{ opacity: 0.5, marginBottom: '0.5rem' }}>Operator Mission</p>
      <h1 className="display-lg">Assigned Units</h1>
      
      {loading ? (
        <p className="body-md" style={{ marginTop: '2rem' }}>Acquiring telemetry...</p>
      ) : (
        <div style={{ marginTop: '2.5rem', display: 'grid', gap: '1.5rem' }}>
          {vehicles.length === 0 ? (
            <Card elevation="low">
              <p className="body-md">No vehicles assigned to your current profile.</p>
            </Card>
          ) : (
            vehicles.map(v => (
              <Card key={v.id} elevation="lowest" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 className="headline-sm">{v.name}</h2>
                  <p className="label-sm" style={{ opacity: 0.6 }}>{v.model} • {v.vin}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="label-md">Current Mileage</p>
                  <p className="headline-sm" style={{ color: 'var(--primary)' }}>{v.currentMileage} KM</p>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const StandardUserDashboard = () => <PlaceholderDashboard role="Standard User" />;
export const ServiceShopDashboard = () => <PlaceholderDashboard role="Service Shop Representative" />;
export const AdminDashboard = () => <PlaceholderDashboard role="Platform Administrator" />;
