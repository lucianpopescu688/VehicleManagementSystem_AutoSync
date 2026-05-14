import React, { useEffect, useState } from 'react';
import Card from '../components/Card/Card';
import Badge from '../components/Badge/Badge';
import ProgressEngine from '../components/ProgressEngine/ProgressEngine';
import Button from '../components/Button/Button';
import { vehicleService } from '../services/vehicleService';
import type { Vehicle } from '../services/vehicleService';

const FleetManagerDashboard: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const data = await vehicleService.listAll();
        setVehicles(data);
      } catch (err: any) {
        setError('Failed to sync fleet data');
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  if (loading) return <div style={{ padding: '2rem' }} className="headline-sm">Syncing with Fleet...</div>;

  return (
    <div className="section-split">
      {/* 70% Primary Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <header>
          <p className="label-md" style={{ opacity: 0.5, marginBottom: '0.5rem' }}>Operator Dashboard</p>
          <h1 className="display-lg">Fleet Performance</h1>
        </header>

        {error && <Card elevation="lowest" style={{ borderLeft: '4px solid var(--error)' }}><p className="body-md" style={{ color: 'var(--error)' }}>{error}</p></Card>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <Card elevation="lowest">
            <p className="label-md" style={{ opacity: 0.6 }}>Total Vehicles</p>
            <p className="display-lg" style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>{vehicles.length}</p>
          </Card>
          <Card elevation="lowest">
            <p className="label-md" style={{ opacity: 0.6 }}>Assigned Drivers</p>
            <p className="display-lg" style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>{vehicles.filter(v => v.assignedDriverId).length}</p>
          </Card>
          <Card elevation="lowest">
            <p className="label-md" style={{ opacity: 0.6 }}>Avg. Uptime</p>
            <p className="display-lg" style={{ fontSize: '2.5rem', marginTop: '0.5rem', color: 'var(--primary)' }}>98.2%</p>
          </Card>
        </div>

        <section style={{ marginTop: '1rem' }}>
          <h2 className="headline-sm" style={{ marginBottom: '1.5rem' }}>Active Fleet List</h2>
          <Card elevation="low" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {vehicles.length === 0 ? (
              <p className="body-md" style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>No vehicles registered in system.</p>
            ) : (
              vehicles.map((v) => (
                <Card key={v.id} elevation="lowest" ghost style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p className="body-md" style={{ fontWeight: 600 }}>{v.name} ({v.model})</p>
                    <p className="label-sm" style={{ opacity: 0.5 }}>VIN: {v.vin} • Mileage: {v.currentMileage} km</p>
                  </div>
                  <Badge variant={v.assignedDriverId ? 'success' : 'neutral'}>
                    {v.assignedDriverId ? 'Deployed' : 'In Reserve'}
                  </Badge>
                </Card>
              ))
            )}
          </Card>
        </section>
      </div>

      {/* 30% Secondary Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <Card elevation="highest" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h2 className="headline-sm" style={{ marginBottom: '1rem' }}>Fleet Alerts</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {vehicles.some(v => v.currentMileage > 100000) ? (
                <Card elevation="lowest" style={{ borderLeft: '4px solid var(--tertiary)' }}>
                  <p className="label-md" style={{ color: 'var(--tertiary)' }}>Maintenance Due</p>
                  <p className="body-md" style={{ marginTop: '0.25rem' }}>High mileage detected on multiple units.</p>
                  <Button variant="tertiary" style={{ marginTop: '1rem', width: '100%' }}>Schedule Service</Button>
                </Card>
              ) : (
                <p className="body-md" style={{ opacity: 0.5 }}>All systems nominal.</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="headline-sm" style={{ marginBottom: '1rem' }}>System Integrity</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <ProgressEngine label="API Sync Status" value={100} />
              <ProgressEngine label="Database Load" value={12} />
              <ProgressEngine label="Token Expiry" value={85} />
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <Button variant="secondary" style={{ width: '100%' }}>System Log</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FleetManagerDashboard;
