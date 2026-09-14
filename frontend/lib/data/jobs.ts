import { JobOpportunity } from '../types/website.types';

/**
 * DEVELOPMENT SEED JOB OPPORTUNITIES
 * Note: These opportunities serve as frontend development seeds representing the confirmed
 * manpower categories. No fake company names or fabricated salary figures are included.
 * Designed to be seamlessly replaced with live backend API data during Phase 8/13.
 */
export const SEED_JOBS: JobOpportunity[] = [
  {
    id: 'job-1',
    slug: 'hotel-front-office-associate',
    title: 'Hotel Front Office Associate',
    category: 'Hotel Staff',
    location: 'Dubai, UAE',
    type: 'Full-Time',
    isFeatured: true,
    overview:
      'Opportunity for customer-oriented hospitality professionals to support guest arrival, check-in operations, and concierge coordination at a leading hospitality property in Dubai.',
    responsibilities: [
      'Manage guest arrivals, check-in, and check-out procedures with high professionalism.',
      'Answer guest inquiries regarding hotel amenities, local attractions, and transportation.',
      'Coordinate with housekeeping and engineering departments to ensure room readiness.',
      'Handle front-desk billing, keycard issuance, and administrative shift logs.',
    ],
    requirements: [
      'Prior experience in hospitality customer service or front-desk operations.',
      'Strong verbal and written English communication skills; multilingual competence is an advantage.',
      'Valid passport with at least 6 months validity.',
      'Commitment to delivering exceptional guest experiences.',
    ],
  },
  {
    id: 'job-2',
    slug: 'commercial-facility-cleaner',
    title: 'Commercial Facility Cleaner',
    category: 'Cleaning',
    location: 'Abu Dhabi, UAE',
    type: 'Full-Time',
    isFeatured: true,
    overview:
      'Seeking reliable hygiene and facility maintenance team members to maintain pristine standards across corporate offices and commercial complexes.',
    responsibilities: [
      'Perform regular sanitization, floor scrubbing, vacuuming, and waste disposal in assigned areas.',
      'Handle commercial cleaning machinery and eco-friendly chemical agents safely according to protocols.',
      'Maintain inventory logs of cleaning supplies and report equipment maintenance needs.',
      'Ensure compliance with UAE public health and commercial hygiene directives.',
    ],
    requirements: [
      'Demonstrated diligence and physical fitness for facility maintenance duties.',
      'Basic conversational communication skills.',
      'Prior commercial cleaning experience is preferred but entry-level candidates with strong work ethic are considered.',
      'Ability to work cooperative shifts within a multi-cultural team.',
    ],
  },
  {
    id: 'job-3',
    slug: 'civil-block-mason',
    title: 'Civil Block & Plaster Mason',
    category: 'Mason',
    location: 'Dubai, UAE',
    type: 'Full-Time',
    isFeatured: true,
    overview:
      'Experienced masons required for active civil residential and commercial projects. Responsible for precise block laying, wall alignment, and exterior plastering.',
    responsibilities: [
      'Lay concrete blocks, hollow bricks, and structural stonework to plumb line specifications.',
      'Mix mortar and apply interior/exterior plaster coatings with smooth, level finishes.',
      'Read and interpret site level measurements, plumb lines, and architectural elevations.',
      'Adhere strictly to site occupational health, safety, and personal protective equipment standards.',
    ],
    requirements: [
      'Proven hands-on experience in block laying, plastering, or tile masonry.',
      'Familiarity with construction site safety protocols and equipment.',
      'Ability to perform physically demanding work in outdoor environments.',
      'Willingness to undertake skills verification assessment.',
    ],
  },
  {
    id: 'job-4',
    slug: 'structural-steel-fixer',
    title: 'Structural Steel Fixer',
    category: 'Steel Fixer',
    location: 'Sharjah, UAE',
    type: 'Full-Time',
    isFeatured: false,
    overview:
      'Skilled steel reinforcement fixers needed for heavy structural foundations, columns, and elevated slabs on commercial development projects.',
    responsibilities: [
      'Cut, bend, and assemble steel rebar reinforcement according to structural bending schedules.',
      'Tie reinforcement steel with tying wire using pliers and automated tie tools.',
      'Position chairs, spacers, and prefabricated rebar cages accurately inside formwork.',
      'Coordinate with site engineers prior to concrete pour inspections.',
    ],
    requirements: [
      'Demonstrated experience in reinforcement steel fixing on building or civil construction sites.',
      'Ability to follow structural drawings and bar bending schedules.',
      'Physical agility and strength to manipulate heavy rebar cages.',
    ],
  },
  {
    id: 'job-5',
    slug: 'shuttering-carpenter',
    title: 'Shuttering Carpenter',
    category: 'Carpenter',
    location: 'Dubai, UAE',
    type: 'Full-Time',
    isFeatured: false,
    overview:
      'Skilled formwork carpenters needed to construct, erect, and dismantle timber and system formwork for concrete columns, beams, and slabs.',
    responsibilities: [
      'Measure, cut, and assemble timber and metal formwork for foundations and suspended slabs.',
      'Install props, scaffolding ties, and bracing to support formwork during concrete pouring.',
      'Check vertical and horizontal alignments with levels, plumb bobs, and measuring tapes.',
      'Safely strip and clean formwork panels following concrete curing.',
    ],
    requirements: [
      'Extensive practical experience in shuttering and formwork construction.',
      'Sound understanding of concrete pressure tolerances and timber joinery.',
      'Strong adherence to job-site PPE and scaffolding safety measures.',
    ],
  },
  {
    id: 'job-6',
    slug: 'express-delivery-bike-rider',
    title: 'Express Delivery Bike Rider',
    category: 'Bike Rider / Delivery Job',
    location: 'Dubai, UAE',
    type: 'Full-Time',
    isFeatured: true,
    overview:
      'Active opportunity for delivery riders to execute time-sensitive parcel, document, and retail deliveries across metropolitan Dubai delivery zones.',
    responsibilities: [
      'Safely operate assigned motorcycle in compliance with all UAE road traffic regulations.',
      'Navigate designated delivery corridors using mobile GPS navigation applications.',
      'Collect, verify, and deliver packages to commercial and residential recipients promptly.',
      'Inspect vehicle daily and report maintenance or mechanical issues immediately.',
    ],
    requirements: [
      'Valid motorcycle driving license (or eligibility for UAE motorcycle conversion/training).',
      'Proficiency in smartphone operation and GPS navigation apps.',
      'Clear driving record with an emphasis on defensive driving and road safety.',
      'Positive customer communication and time-management skills.',
    ],
  },
  {
    id: 'job-7',
    slug: 'city-taxi-driver',
    title: 'Metropolitan Fleet Taxi Driver',
    category: 'Taxi Driver',
    location: 'Dubai, UAE',
    type: 'Full-Time',
    isFeatured: false,
    overview:
      'Professional drivers seeking passenger transportation careers across Dubai. Comprehensive training and licensing coordination provided for qualified applicants.',
    responsibilities: [
      'Transport passengers safely and comfortably across Dubai and inter-emirate routes.',
      'Operate taximeter, electronic payment terminal, and dispatch communication systems.',
      'Maintain vehicle interior cleanliness and perform basic daily fluid inspections.',
      'Assist passengers with luggage and uphold courteous customer service standards.',
    ],
    requirements: [
      'Valid home-country driving license with minimum 2 years driving experience.',
      'Clean background and driving record.',
      'Good conversational English skills to communicate with passengers and dispatch.',
      'Pass medical fitness examination and regulatory driver permit training.',
    ],
  },
  {
    id: 'job-8',
    slug: 'heavy-truck-driver',
    title: 'Heavy Transport Truck Driver',
    category: 'Truck Driver',
    location: 'Abu Dhabi / Dubai, UAE',
    type: 'Full-Time',
    isFeatured: false,
    overview:
      'Long-haul and industrial transport drivers required for heavy goods vehicles, flatbeds, and container transport across UAE industrial and port corridors.',
    responsibilities: [
      'Operate heavy articulated vehicles safely over national highways and industrial access roads.',
      'Verify cargo loading distribution, tie-down security, and documentation manifest compliance.',
      'Conduct pre-trip and post-trip vehicle inspections (brakes, tires, lights, fluids).',
      'Follow designated freight routes and adhere to national axle weight regulations.',
    ],
    requirements: [
      'Valid heavy vehicle driving license (Category 4 / Heavy Truck).',
      'Minimum 3 years proven heavy transport driving experience.',
      'Good physical health and endurance for scheduled long-haul driving shifts.',
      'Strict adherence to speed governors and driver fatigue safety guidelines.',
    ],
  },
];

export function getJobBySlug(slug: string): JobOpportunity | undefined {
  return SEED_JOBS.find((job) => job.slug === slug);
}
