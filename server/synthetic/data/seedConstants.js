/**
 * Domain constants and realistic master datasets for Patel Ji Tent House synthetic data.
 * Focuses on authentic Rajasthan / Jaipur event rental dynamics.
 */

const FIRST_NAMES = [
  'Aarav', 'Aditya', 'Amit', 'Anil', 'Ankit', 'Ashok', 'Ayush', 'Bharat', 'Bhavik', 'Chetan',
  'Deepak', 'Devendra', 'Dharmendra', 'Dinesh', 'Gaurav', 'Gopal', 'Govind', 'Harish', 'Hemant', 'Hitesh',
  'Jagdish', 'Jitendra', 'Kailash', 'Kamal', 'Kapil', 'Karan', 'Kishore', 'Kuldeep', 'Lalit', 'Lokendra',
  'Mahesh', 'Manish', 'Manoj', 'Mohan', 'Mukesh', 'Narendra', 'Naresh', 'Naveen', 'Nitin', 'Pankaj',
  'Pawan', 'Pradeep', 'Prakash', 'Pramod', 'Prashant', 'Praveen', 'Pushpendra', 'Rahul', 'Rajendra', 'Rajesh',
  'Rakesh', 'Ram', 'Ramesh', 'Ratan', 'Ravi', 'Rohit', 'Sachin', 'Sandeep', 'Sanjay', 'Satish',
  'Saurabh', 'Sharad', 'Shashi', 'Shrawan', 'Shubham', 'Siddharth', 'Somesh', 'Subhash', 'Sudhir', 'Sumit',
  'Sunil', 'Surendra', 'Suresh', 'Tarun', 'Umesh', 'Vikas', 'Vikram', 'Vinod', 'Virendra', 'Vishal',
  'Aarti', 'Ananya', 'Anita', 'Anjali', 'Ankita', 'Asha', 'Barkha', 'Bhavna', 'Chanda', 'Deepa',
  'Deepika', 'Divya', 'Geeta', 'Gunjan', 'Harsha', 'Jyoti', 'Kamlesh', 'Kavita', 'Kiran', 'Komal',
  'Lata', 'Madhu', 'Mamta', 'Manju', 'Maya', 'Meena', 'Meenakshi', 'Monika', 'Neelam', 'Neha',
  'Nidhi', 'Nisha', 'Pooja', 'Poonam', 'Pratibha', 'Preeti', 'Priya', 'Priyanka', 'Pushpa', 'Rachna',
  'Radha', 'Rani', 'Rekha', 'Renu', 'Ritu', 'Roshni', 'Ruchi', 'Sakshi', 'Sangeeta', 'Santosh',
  'Sarita', 'Seema', 'Shalu', 'Shanti', 'Sharda', 'Sheetal', 'Shikha', 'Shobha', 'Sneha', 'Soniya',
  'Sunita', 'Sushila', 'Swati', 'Tanvi', 'Urmila', 'Usha', 'Vandana', 'Varsha', 'Veena', 'Vidhi'
];

const LAST_NAMES = [
  'Patel', 'Sharma', 'Verma', 'Gupta', 'Rathore', 'Shekhawat', 'Choudhary', 'Meena', 'Agarwal', 'Jain',
  'Singh', 'Joshi', 'Yadav', 'Soni', 'Bishnoi', 'Khandelwal', 'Maheshwari', 'Mittal', 'Pareek', 'Bansal',
  'Goyal', 'Mishra', 'Tiwari', 'Nagar', 'Gurjar', 'Purohit', 'Shrimali', 'Saini', 'Mali', 'Kumawat',
  'Jangid', 'Chauhan', 'Solanki', 'Bhati', 'Gehlot', 'Tanwar', 'Kachhwaha', 'Sisodia', 'Dadhich', 'Gautam'
];

const JAIPUR_LOCATIONS = [
  'Mansarovar, Jaipur',
  'Vaishali Nagar, Jaipur',
  'Malviya Nagar, Jaipur',
  'Raja Park, Jaipur',
  'C-Scheme, Ashok Nagar, Jaipur',
  'Jagatpura, Jaipur',
  'Civil Lines, Jaipur',
  'Tonk Road, Jaipur',
  'Bani Park, Jaipur',
  'Vidyadhar Nagar, Jaipur',
  'Sitapura Industrial Area, Jaipur',
  'Pratap Nagar, Jaipur',
  'Ajmer Road, Jaipur',
  'Jhotwara, Jaipur',
  'Sanganer, Jaipur',
  'Chitrakoot, Jaipur',
  'Shyam Nagar, Jaipur',
  'Gopalpura Bypass, Jaipur',
  'Durgapura, Jaipur',
  'Amer Road, Jaipur',
  'Kukas Event Corridor, Jaipur',
  'Sirsi Road, Jaipur',
  'Gandhi Path, Vaishali Nagar, Jaipur',
  'Jawahar Circle Lawn, Malviya Nagar, Jaipur',
  'Rambagh Enclave, Bhawani Singh Road, Jaipur',
  'Diggi Palace Area, Shivaji Marg, Jaipur',
  'Chomu Palace Environs, Jaipur',
  'Bais Godam, Jaipur',
  'Govind Marg, Adarsh Nagar, Jaipur',
  'Lalkothi, Jaipur'
];

const EVENT_TYPES = [
  'Wedding',
  'Engagement',
  'Birthday',
  'Reception',
  'Corporate',
  'Religious',
  'Other'
];

const EVENT_TYPE_WEIGHTS = {
  Wedding: 0.38,
  Engagement: 0.14,
  Reception: 0.16,
  Birthday: 0.12,
  Corporate: 0.08,
  Religious: 0.08,
  Other: 0.04
};

// Monthly seasonality multiplier for Rajasthan event market (Index 0 = Jan, 11 = Dec)
const MONTHLY_SEASONALITY = [
  1.25, // Jan (Peak winter weddings)
  1.45, // Feb (Peak auspicious wedding muhurats)
  0.85, // Mar (Post-Holi social gatherings)
  1.15, // Apr (Summer wedding muhurats / Akshaya Tritiya)
  1.30, // May (Peak summer weddings)
  0.80, // Jun (Early summer wind-down)
  0.40, // Jul (Monsoon / Chaturmas - weddings pause)
  0.40, // Aug (Monsoon / Raksha Bandhan / Janmashtami)
  0.60, // Sep (Ganesh Chaturthi / pre-festive)
  1.10, // Oct (Navratri / Pre-Diwali corporate & social)
  1.65, // Nov (Devuthani Ekadashi - massive wedding rush)
  1.50  // Dec (Peak winter NRI / destination weddings)
];

const CATEGORIES_MASTER = [
  { name: 'Tents & Canopies', slug: 'tents', description: 'Royal waterproof marquees, German hangars, shamianas, and gazebos' },
  { name: 'Banquet & Furniture', slug: 'furniture', description: 'Cushioned banquet chairs, round tables, maharaja sofas, and VIP seating' },
  { name: 'Decorative Lighting', slug: 'lighting', description: 'LED floodlights, crystal chandeliers, fairy string lights, and truss lights' },
  { name: 'Stage & Mandap Decor', slug: 'decoration', description: 'Traditional wedding mandaps, entry gates, floral arches, and thematic backdrops' },
  { name: 'Stage & Audio-Visual', slug: 'stage', description: 'Carpeted risers, aluminum stage trusses, podiums, and barricades' },
  { name: 'Catering & Dining Essentials', slug: 'catering', description: 'Chafing dishes, live counter tables, crockery, and buffet setup counters' },
  { name: 'Sound Systems & Acoustics', slug: 'sound-systems', description: 'High-power PA systems, corded/wireless mics, and audio consoles' },
  { name: 'Utilities & Power Support', slug: 'utilities', description: 'Silent diesel generators, jumbo mist coolers, industrial pedestal fans' }
];

module.exports = {
  FIRST_NAMES,
  LAST_NAMES,
  JAIPUR_LOCATIONS,
  EVENT_TYPES,
  EVENT_TYPE_WEIGHTS,
  MONTHLY_SEASONALITY,
  CATEGORIES_MASTER
};

