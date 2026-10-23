/** Reviewed against UTD department pages and its public Comet Calendar place data. */
export const CAMPUS_GUIDE_REVIEWED = '2026-10-06';
export const CAMPUS_DINING_SOURCE = 'https://services.utdallas.edu/dining/';

export type CampusPlace = {
  id: string;
  code: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  sourceUrl: string;
  coordinateSourceUrl: string;
};

// Building pins, never an assertion of an accessible entrance or an indoor room.
export const CAMPUS_PLACES: CampusPlace[] = [
  {id:'ssa',code:'SSA',name:'Student Services Addition',description:'Comet Card Office: second floor, SSA 12.324.',address:'Student Services Addition, UT Dallas, Richardson, TX 75080',latitude:32.98581,longitude:-96.749414,sourceUrl:'https://cometcard.utdallas.edu/',coordinateSourceUrl:'https://calendar.utdallas.edu/ssa'},
  {id:'ssb',code:'SSB',name:'Student Services Building',description:'ISSO: 4.600. Student Health Center: 4.700.',address:'780 Franklyn Jenifer Drive, Richardson, TX 75080',latitude:32.985858,longitude:-96.748734,sourceUrl:'https://isso.utdallas.edu/',coordinateSourceUrl:'https://calendar.utdallas.edu/ssb'},
  {id:'mc',code:'MC',name:'McDermott Library',description:'Study space, books, printing and the Comet Cupboard.',address:'Eugene McDermott Library, UT Dallas, Richardson, TX 75080',latitude:32.987108,longitude:-96.747635,sourceUrl:'https://library.utdallas.edu/',coordinateSourceUrl:'https://calendar.utdallas.edu/mc'},
  {id:'su',code:'SU',name:'Student Union',description:'Food, student activities and places to meet.',address:'Student Union, UT Dallas, Richardson, TX 75080',latitude:32.986866,longitude:-96.748901,sourceUrl:'https://union.utdallas.edu/',coordinateSourceUrl:'https://calendar.utdallas.edu/su'},
  {id:'acb',code:'ACB',name:'Bookstore & UPS Store',description:'Books, study supplies, technology, printing and shipping.',address:'842 Loop Road SW, Richardson, TX 75080',latitude:32.984793,longitude:-96.749707,sourceUrl:'https://calendar.utdallas.edu/vcb',coordinateSourceUrl:'https://calendar.utdallas.edu/vcb'},
  {id:'ab',code:'AB',name:'Activity Center',description:'Fitness, indoor courts and the swimming pool.',address:'842 Loop Road SW, Richardson, TX 75080',latitude:32.98509,longitude:-96.749795,sourceUrl:'https://urec.utdallas.edu/',coordinateSourceUrl:'https://calendar.utdallas.edu/ab'},
  {id:'jsom',code:'JSOM',name:'Jindal School of Management',description:'Business classes, Starbucks and a Market.',address:'Naveen Jindal School of Management, UT Dallas, Richardson, TX 75080',latitude:32.985206,longitude:-96.746884,sourceUrl:'https://jindal.utdallas.edu/',coordinateSourceUrl:'https://calendar.utdallas.edu/api/2/places/31007253072228'},
  {id:'ecsw',code:'ECSW',name:'Engineering & Computer Science West',description:'Engineering classes, study areas and a Market.',address:'902 Franklyn Jenifer Drive, Richardson, TX 75080',latitude:32.986102,longitude:-96.751378,sourceUrl:'https://calendar.utdallas.edu/ecsw',coordinateSourceUrl:'https://calendar.utdallas.edu/ecsw'},
  {id:'sci',code:'SCI',name:'Sciences Building',description:'Science classes, a courtyard and a Market.',address:'Sciences Building, UT Dallas, Richardson, TX 75080',latitude:32.989016,longitude:-96.750277,sourceUrl:'https://calendar.utdallas.edu/sci',coordinateSourceUrl:'https://calendar.utdallas.edu/sci'},
  {id:'ps3',code:'PS3',name:'Parking Structure 3',description:'Einstein Bros. Bagels and Taco Bell Cantina.',address:'Parking Structure 3, UT Dallas, Richardson, TX 75080',latitude:32.990927,longitude:-96.750928,sourceUrl:CAMPUS_DINING_SOURCE,coordinateSourceUrl:'https://calendar.utdallas.edu/api/2/places/31007255884745'},
  {id:'rha',code:'RHA',name:'Andromeda Hall & dining',description:'Dining Hall West, Comet Pi and a Market in the Andromeda complex.',address:'955 North Loop Road, Richardson, TX 75080',latitude:32.990351,longitude:-96.754632,sourceUrl:CAMPUS_DINING_SOURCE,coordinateSourceUrl:'https://www.openstreetmap.org/way/598197612'},
];

export const COMET_CARD_OFFICE = {
  placeId:'ssa', room:'SSA 12.324', floor:'Second floor',
  hours:'Monday–Friday, 9 a.m.–5 p.m. Check holiday changes before visiting.',
  phone:'972-883-2495', url:'https://cometcard.utdallas.edu/',
};

export type CampusTool = {id:string;name:string;action:string;url:string;sourceUrl:string;group:'start'|'more'};
export const CAMPUS_TOOLS: CampusTool[] = [
  {id:'netid',name:'NetID',action:'Activate your UTD account and set your password.',url:'https://netid.utdallas.edu/',sourceUrl:'https://oit.utdallas.edu/new-to-utd/',group:'start'},
  {id:'duo',name:'Duo / NetIDplus',action:'Set up the second sign-in step for UTD services.',url:'https://infosecurity.utdallas.edu/information-hub/netidplus-provides-a-second-layer-of-security-for-utd/',sourceUrl:'https://infosecurity.utdallas.edu/information-hub/netidplus-provides-a-second-layer-of-security-for-utd/',group:'start'},
  {id:'email',name:'UTD email',action:'Open your university inbox and check it regularly.',url:'https://outlook.office.com/',sourceUrl:'https://atlas.utdallas.edu/TDClient/30/Portal/KB/ArticleDet?ID=260',group:'start'},
  {id:'galaxy',name:'Galaxy: Orion & Polaris',action:'Check registration, tuition, holds and your student task list.',url:'https://www.utdallas.edu/galaxy/',sourceUrl:'https://www.utdallas.edu/galaxy/',group:'start'},
  {id:'canvas',name:'Canvas / eLearning',action:'Find your courses, assignments and class announcements. UTD moved academic courses to Canvas for fall 2026.',url:'https://elearning.utdallas.edu/',sourceUrl:'https://ets.utdallas.edu/elearning-services/canvas-migration/',group:'start'},
  {id:'isso',name:'ISSO & iComet',action:'International students: follow the official arrival and enrollment checklist.',url:'https://isso.utdallas.edu/',sourceUrl:'https://isso.utdallas.edu/',group:'start'},
  {id:'calendar',name:'Academic calendar',action:'Save your term’s start, payment and registration dates.',url:'https://registrar.utdallas.edu/calendar/',sourceUrl:'https://registrar.utdallas.edu/calendar/',group:'more'},
  {id:'coursebook',name:'CourseBook',action:'Look up class details, instructors and available syllabi.',url:'https://coursebook.utdallas.edu/',sourceUrl:'https://ets.utdallas.edu/elearning-services/students/current-students-overview/',group:'more'},
  {id:'mobile',name:'UTD mobile app',action:'Keep campus resources, events and student connections handy.',url:'https://www.utdallas.edu/utd-mobile-application/',sourceUrl:'https://atlas.utdallas.edu/TDClient/30/Portal/Requests/Service/50/UTD-Official-Mobile-App',group:'more'},
  {id:'health',name:'Student Health Center',action:'Find appointment information and your student health portal. Office: SSB 4.700.',url:'https://studenthealthcenter.utdallas.edu/',sourceUrl:'https://studenthealthcenter.utdallas.edu/',group:'more'},
  {id:'tech',name:'Tech help',action:'Use OIT’s new-student checklist for Wi-Fi, software and account help.',url:'https://oit.utdallas.edu/new-to-utd/',sourceUrl:'https://oit.utdallas.edu/new-to-utd/',group:'more'},
];

export type CampusDiningArea = {id:string;placeId:string;name:string;description:string;options:string[];sourceUrl:string};
export const CAMPUS_DINING_AREAS: CampusDiningArea[] = [
  {id:'student-union',placeId:'su',name:'Student Union',description:'The biggest cluster of campus food options.',options:['Chick-fil-A','Panda Express','Crave','Kalachandji’s Express','Firehouse Subs','The Halal Shack','Buffalo Wild Wings','Starbucks','Tea Co','The Market','Food Truck Park'],sourceUrl:CAMPUS_DINING_SOURCE},
  {id:'andromeda',placeId:'rha',name:'Andromeda Hall area',description:'Dining Hall West offers rotating meals; Comet Pi and the Market add quick options.',options:['Dining Hall West','Comet Pi','The Market'],sourceUrl:CAMPUS_DINING_SOURCE},
  {id:'ps3',placeId:'ps3',name:'Parking Structure 3',description:'Bagels or tacos on the north side of campus.',options:['Einstein Bros. Bagels','Taco Bell Cantina'],sourceUrl:CAMPUS_DINING_SOURCE},
  {id:'jsom',placeId:'jsom',name:'Jindal School of Management',description:'Coffee and grab-and-go food between classes.',options:['Starbucks','The Market'],sourceUrl:CAMPUS_DINING_SOURCE},
  {id:'bookstore',placeId:'acb',name:'Activity Center Bookstore',description:'A coffee stop near the bookstore and recreation center.',options:['Bookstore Coffee Shop'],sourceUrl:CAMPUS_DINING_SOURCE},
  {id:'ecsw',placeId:'ecsw',name:'Engineering & Computer Science West',description:'A quick campus market stop.',options:['The Market'],sourceUrl:CAMPUS_DINING_SOURCE},
  {id:'sci',placeId:'sci',name:'Sciences Building',description:'Grab-and-go food on the north side of the academic campus.',options:['The Market'],sourceUrl:CAMPUS_DINING_SOURCE},
];

export const CAMPUS_ESSENTIALS = [
  {id:'cupboard',placeId:'mc',name:'Comet Cupboard',location:'McDermott Library · basement · MC 1.608',description:'Free food and personal care items for students.',beforeYouGo:'Complete the online orientation and agreement before your first visit. Bring your Comet Card and a reusable bag.',url:'https://cometcupboard.utdallas.edu/',sourceUrl:'https://basicneeds.utdallas.edu/resource-hub/'},
  {id:'bookstore',placeId:'acb',name:'University Bookstore',location:'Activity Center Bookstore · ACB',description:'Textbooks, notebooks, course supplies and technology.',beforeYouGo:'Use your class list to check the exact materials you need.',url:'https://www.bkstr.com/texasatdallasstore/home',sourceUrl:'https://calendar.utdallas.edu/vcb'},
  {id:'ups',placeId:'acb',name:'Campus UPS Store',location:'Inside Activity Center Bookstore · ACB',description:'Printing, copying, packing and shipping.',beforeYouGo:'Check the service and opening hours before bringing a parcel.',url:'https://services.utdallas.edu/print/',sourceUrl:'https://www.utdallas.edu/campus-life/student-services-support/'},
] as const;

export function campusPlace(id:string):CampusPlace {
  const place=CAMPUS_PLACES.find(item=>item.id===id);
  if (!place) throw new Error(`Unknown campus place: ${id}`);
  return place;
}
