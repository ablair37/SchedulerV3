import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Clock, MapPin, Syringe, AlertTriangle, Info, Globe2 } from 'lucide-react';

const ClinicScheduler = () => {
  const [clinicType, setClinicType] = useState('local');
  const [doseCount, setDoseCount] = useState(50);
  const [hours, setHours] = useState(4);
  const [spanishSpeakingPct, setSpanishSpeakingPct] = useState(0);
  const [distance, setDistance] = useState('');
  const [distanceUnit, setDistanceUnit] = useState('miles');

  const getDistanceWarning = () => {
    if (!distance) return null;
    
    const miles = distanceUnit === 'hours' 
      ? parseFloat(distance) * 55 // Approximate miles per hour
      : parseFloat(distance);
    
    if (miles >= 50 && clinicType === 'local') {
      return {
        type: 'error',
        message: 'This clinic is over 50 miles away and should be classified as Travel'
      };
    }
    if (miles < 50 && clinicType === 'travel') {
      return {
        type: 'warning',
        message: 'This clinic is under 50 miles away and could be classified as Local'
      };
    }
    return null;
  };

  const getBreakRequirements = (hours) => {
    const requirements = [];
    
    // Rest breaks (10-minute)
    const restBreaks = Math.floor(hours / 4);
    if (restBreaks > 0) {
      requirements.push(${restBreaks} paid 10-minute rest break${restBreaks > 1 ? 's' : ''} required);
    }
    
    // Meal break (30-minute)
    if (hours > 5) {
      requirements.push('30-minute unpaid meal break required');
    }
    
    return requirements;
  };

  const standardConfigs = {
    'local-50-short': {
      doseRange: [1, 75],
      hourRange: [1, 4],
      total: 5,
      breakdown: {
        lead: 1,
        dispenser: 1,
        admin: 2,
        vaccinator: 1
      },
      requiresCrossTrained: false,
      patients: '17-25',
      allowed: true,
      considerations: [
        'Standard setup time: 30 minutes',
        'Standard cleanup time: 30 minutes',
        'Regular break schedule applies'
      ]
    },
    'local-50-long': {
      doseRange: [1, 75],
      hourRange: [4.1, 6],
      total: 4,
      breakdown: {
        lead: 1,
        dispenser: 1,
        admin: 1,
        vaccinator: 1
      },
      requiresCrossTrained: true,
      notes: 'Vaccinator MUST be cross-trained as admin',
      patients: '17-25',
      allowed: true,
      considerations: [
        'Extended duration requires break rotation',
        'Vaccinator MUST be cross-trained as admin',
        'Consider staff meal breaks'
      ]
    },
    'travel-50-short': {
      doseRange: [1, 75],
      hourRange: [1, 4],
      total: 4,
      breakdown: {
        lead: 1,
        dispenser: 1,
        admin: 1,
        vaccinator: 1
      },
      requiresCrossTrained: true,
      notes: 'Vaccinator MUST be cross-trained as admin',
      patients: '17-25',
      allowed: true,
      considerations: [
        'Account for travel time',
        'Vaccinator MUST be cross-trained as admin',
        'Pack all required supplies'
      ]
    },
    'local-250-short': {
      doseRange: [76, 250],
      hourRange: [1, 4],
      total: 11,
      breakdown: {
        lead: 1,
        dispenser: 1,
        admin: 5,
        vaccinator: 4
      },
      requiresCrossTrained: false,
      notes: 'Staffing level discretionary based on expected demand',
      patients: '80-125',
      allowed: true,
      considerations: [
        'Staffing levels at scheduling team discretion',
        'Multiple check-in stations needed',
        'Coordinate break rotations'
      ]
    },
    'local-250-long': {
      doseRange: [76, 250],
      hourRange: [4.1, 6],
      total: 8,
      breakdown: {
        lead: 1,
        dispenser: 1,
        admin: 3,
        vaccinator: 3
      },
      requiresCrossTrained: false,
      patients: '80-125',
      allowed: true,
      considerations: [
        'Extended duration requires meal breaks',
        'Staff rotation schedule needed',
        'Monitor supply levels throughout'
      ]
    }
  };

  const getMatchingConfig = () => {
    // Handle special cases first
    if (clinicType === 'travel' && doseCount > 75) {
      return {
        total: 0,
        notes: 'Travel clinics over 50 doses require special approval - contact scheduling team, Jen, and Josh',
        approvalPath: ['Scheduling Team', 'Jen', 'Josh'],
        allowed: false
      };
    }

    if (clinicType === 'travel' && hours > 4) {
      return {
        total: 0,
        notes: 'Travel clinics over 4 hours are not permitted - reduce to 4 hour clinic',
        allowed: false
      };
    }

    // Find matching configuration
    let configKey;
    if (clinicType === 'local') {
      if (doseCount <= 75) {
        configKey = hours <= 4 ? 'local-50-short' : 'local-50-long';
      } else {
        configKey = hours <= 4 ? 'local-250-short' : 'local-250-long';
      }
    } else { // travel
      if (doseCount <= 75 && hours <= 4) {
        configKey = 'travel-50-short';
      }
    }

    if (configKey) {
      const minSpanishStaff = Math.ceil(standardConfigs[configKey].total * (spanishSpeakingPct >= 25 ? 0.25 : spanishSpeakingPct / 100));
      return {
        ...standardConfigs[configKey],
        spanishSpeakingStaff: minSpanishStaff
      };
    }

    return {
      total: 0,
      notes: 'Invalid clinic configuration',
      allowed: false
    };
  };

  const staffing = getMatchingConfig();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          Clinic Staffing Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Clinic Type:
              </label>
              <select 
                className="w-full p-2 border rounded"
                value={clinicType}
                onChange={(e) => setClinicType(e.target.value)}
              >
                <option value="local">Local</option>
                <option value="travel">Travel</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Distance from Office:
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="Optional"
                  min="0"
                />
                <select 
                  className="p-2 border rounded"
                  value={distanceUnit}
                  onChange={(e) => setDistanceUnit(e.target.value)}
                >
                  <option value="miles">miles</option>
                  <option value="hours">hours</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <Globe2 className="h-4 w-4" />
                Spanish-Speaking Population (%):
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={spanishSpeakingPct}
                onChange={(e) => setSpanishSpeakingPct(Math.min(100, Math.max(0, Number(e.target.value))))}
                min="0"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <Syringe className="h-4 w-4" />
                Number of Doses:
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={doseCount}
                onChange={(e) => setDoseCount(Math.max(1, Number(e.target.value)))}
                min="1"
                max="250"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration (hours):
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={hours}
                onChange={(e) => setHours(Math.max(1, Number(e.target.value)))}
                min="1"
                max="6"
                step="0.5"
              />
            </div>
          </div>

          {distance && (
            <div className="mt-2">
              {getDistanceWarning() && (
                <Alert className={getDistanceWarning().type === 'error' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}>
                  <AlertDescription className="flex items-center gap-2">
                    <AlertTriangle className={h-4 w-4 ${getDistanceWarning().type === 'error' ? 'text-red-500' : 'text-yellow-500'}} />
                    {getDistanceWarning().message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {staffing.allowed ? (
            <div className="mt-6 space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Required Staff: {staffing.total} people</h3>
                {staffing.patients && (
                  <p className="text-sm text-gray-600 mb-2">
                    Expected patients: {staffing.patients}
                  </p>
                )}
                {staffing.breakdown && (
                  <>
                    <ul className="list-disc list-inside space-y-1">
                      <li>{staffing.breakdown.lead} Lead</li>
                      <li>{staffing.breakdown.dispenser} Dispenser/Assistant Transporter</li>
                      <li>{staffing.breakdown.admin} Admin Staff</li>
                      <li>
                        {staffing.breakdown.vaccinator} Vaccinator{staffing.breakdown.vaccinator > 1 ? 's' : ''}
                        {staffing.requiresCrossTrained && (
                          <span className="text-gray-600 ml-2">
                            (must be cross-trained as admin)
                          </span>
                        )}
                      </li>
                    </ul>
                    {staffing.requiresCrossTrained && (
                      <div className="mt-2 text-sm text-gray-600 italic">
                        Note: This configuration requires a cross-trained vaccinator
                      </div>
                    )}
                  </>
                )}
                {staffing.spanishSpeakingStaff > 0 && (
                  <div className="mt-2 p-2 bg-blue-100 rounded">
                    <p className="font-medium">Minimum Spanish-Speaking Staff Required: {staffing.spanishSpeakingStaff}</p>
                  </div>
                )}
                {staffing.notes && (
                  <div className="flex items-start gap-2 mt-2 text-sm text-gray-600 italic">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <p>{staffing.notes}</p>
                  </div>
                )}
              </div>

              {hours > 4 && (
                <div className="mt-4 bg-amber-50 p-3 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4" />
                    Required Breaks (CO Law)
                  </h4>
                  <ul className="space-y-1">
                    {getBreakRequirements(hours).map((requirement, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span>•</span>
                        {requirement}
                      </li>
                    ))}
                    <li className="text-xs text-gray-600 mt-1">Note: Breaks must be scheduled to maintain continuous clinic operation</li>
                  </ul>
                </div>
              )}

              <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4" />
                  Time Requirements
                </h4>
                <ul className="space-y-1 text-sm">
                  <li>Clinic Duration: {hours} hours</li>
                  <li>Setup/Breakdown: +1 hour (30 min each)</li>
                  {distance ? (
                    <>
                      <li>Travel Distance: {distance} {distanceUnit}</li>
                      {distanceUnit === 'hours' ? (
                        <li>Total Time: {(parseFloat(hours) + 1 + 2 * parseFloat(distance)).toFixed(1)} hours (including setup, breakdown, and round-trip travel)</li>
                      ) : (
                        <>
                          <li className="text-gray-600">Estimated Travel Time (at 55 mph): {(2 * parseFloat(distance) / 55).toFixed(1)} hours round-trip</li>
                          <li>Total Time: {(parseFloat(hours) + 1 + 2 * parseFloat(distance) / 55).toFixed(1)} hours (clinic + setup/breakdown + estimated travel)</li>
                          <li className="text-xs text-gray-500 mt-1">* Travel time may vary based on route conditions and traffic</li>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <li>Total Time: {(parseFloat(hours) + 1).toFixed(1)} hours (including setup and breakdown)</li>
                      {clinicType === 'travel' && 
                        <li className="text-amber-600">Travel time not included - add distance for total time estimate</li>
                      }
                    </>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <Alert className="mt-6">
              <AlertDescription>
                {staffing.notes}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClinicScheduler;
