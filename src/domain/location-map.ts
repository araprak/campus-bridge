/** Official OSM HTML embed. No geolocation, address lookup, account data or API key. */
export function mapEmbedUrl(latitude:number,longitude:number) {
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>85||Math.abs(longitude)>180)throw new Error('Invalid map coordinates.');
  const query=new URLSearchParams({bbox:[longitude-.006,latitude-.004,longitude+.006,latitude+.004].join(','),layer:'mapnik',marker:`${latitude},${longitude}`});
  return `https://www.openstreetmap.org/export/embed.html?${query}`;
}
