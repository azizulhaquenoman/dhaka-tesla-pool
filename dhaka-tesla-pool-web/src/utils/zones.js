export const DHAKA_ZONES = [
  { id: 'banani',      label: 'Banani',      lat: 23.7945, lng: 90.4008, corridor: 'north' },
  { id: 'gulshan-1',   label: 'Gulshan 1',   lat: 23.7806, lng: 90.4147, corridor: 'north' },
  { id: 'gulshan-2',   label: 'Gulshan 2',   lat: 23.7967, lng: 90.4142, corridor: 'north' },
  { id: 'mohakhali',   label: 'Mohakhali',   lat: 23.7773, lng: 90.3990, corridor: 'north' },
  { id: 'uttara',      label: 'Uttara',      lat: 23.8759, lng: 90.3795, corridor: 'north-far' },
  { id: 'bashundhara', label: 'Bashundhara', lat: 23.8144, lng: 90.4258, corridor: 'north' },
  { id: 'farmgate',    label: 'Farmgate',    lat: 23.7599, lng: 90.3906, corridor: 'central' },
  { id: 'dhanmondi',   label: 'Dhanmondi',   lat: 23.7461, lng: 90.3742, corridor: 'central' },
  { id: 'mirpur',      label: 'Mirpur',      lat: 23.8223, lng: 90.3654, corridor: 'west' },
  { id: 'motijheel',   label: 'Motijheel',   lat: 23.7279, lng: 90.4177, corridor: 'central' },
];

// Symmetric lookup — undefined falls back to 5 km
const DISTANCES = {
  'banani-gulshan-1': 2.5, 'banani-gulshan-2': 2.8,  'banani-mohakhali': 3.0,
  'banani-uttara': 8.0,    'banani-bashundhara': 4.0, 'banani-farmgate': 4.5,
  'banani-dhanmondi': 6.0, 'banani-mirpur': 7.0,      'banani-motijheel': 7.5,
  'gulshan-1-gulshan-2': 1.5, 'gulshan-1-mohakhali': 2.0, 'gulshan-1-bashundhara': 3.5,
  'gulshan-1-farmgate': 4.0,  'gulshan-1-dhanmondi': 5.5, 'gulshan-1-motijheel': 5.0,
  'gulshan-2-mohakhali': 2.5, 'gulshan-2-farmgate': 4.5,  'gulshan-2-bashundhara': 3.0,
  'mohakhali-farmgate': 3.0,  'mohakhali-dhanmondi': 5.0, 'mohakhali-bashundhara': 4.5,
  'farmgate-dhanmondi': 2.5,  'farmgate-motijheel': 3.5,  'farmgate-mirpur': 5.0,
  'dhanmondi-motijheel': 4.5, 'dhanmondi-mirpur': 4.5,
  'uttara-bashundhara': 5.0,  'uttara-mirpur': 9.0,
  'mirpur-mohakhali': 6.0,
};

export const getZoneById   = (id) => DHAKA_ZONES.find((z) => z.id === id);
export const getDistanceKm = (a, b) =>
  DISTANCES[`${a}-${b}`] ?? DISTANCES[`${b}-${a}`] ?? 5.0;
