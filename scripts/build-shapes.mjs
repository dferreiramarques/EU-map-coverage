// Builds src/shapes.json (pre-projected SVG paths) from Natural Earth 1:50m admin-0 map units.
// Usage: npm run shapes -- path/to/ne_50m_admin_0_map_units.geojson
// Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_map_units.geojson
import fs from 'fs';
import {geoConicConformal, geoPath, geoCentroid} from 'd3-geo';
const g=JSON.parse(fs.readFileSync(process.argv[2]||'ne_50m_admin_0_map_units.geojson'));
const W=1000,H=860;
const proj=geoConicConformal().rotate([-13,0]).center([0,53]).parallels([40,62]).scale(1200).translate([W*0.46,H*0.5]).clipExtent([[0,0],[W,H]]);
const path=geoPath(proj).digits(1);
const groups={};
const nameFix={PSX:'Palestine',GBR:'Great Britain',BEL:'Belgium',SRB:'Serbia',BIH:'Bosnia and Herzegovina',PRT:'Portugal',FRA:'France',NOR:'Norway',FIN:'Finland',GEO:'Georgia',CYN:'Cyprus',CYP:'Cyprus'};
for(const f of g.features){const p=f.properties;
  let key=p.ADM0_A3; if(key==='ALA'||key==='ALD')key='FIN'; if(key==='CYN')key='CYP'; 
  let polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
  polys=polys.filter(pl=>{const c=geoCentroid({type:'Polygon',coordinates:pl});return c[0]>-32&&c[0]<70&&c[1]>26&&c[1]<82;});
  if(!polys.length)continue;
  (groups[key]??={key,name:key==='NIR'?'Northern Ireland':(nameFix[key]||p.ADMIN||p.NAME_EN),polys:[]}).polys.push(...polys);
}
const out=[];
for(const k in groups){const gr=groups[k];
  const d=path({type:'MultiPolygon',coordinates:gr.polys}); if(!d)continue;
  // label at centroid of largest projected polygon
  let best=null,ba=-1; for(const pl of gr.polys){const a=path.area({type:'Polygon',coordinates:pl}); if(a>ba){ba=a;best=pl;}}
  const c=path.centroid({type:'Polygon',coordinates:best});
  const area=path.area({type:'MultiPolygon',coordinates:gr.polys});
  const bb=path.bounds({type:'MultiPolygon',coordinates:gr.polys});out.push({k,n:k==='GBR'?'United Kingdom':gr.name,d,c:c.map(v=>Math.round(v)),a:Math.round(area),b:bb.flat().map(v=>Math.round(v))});
}
fs.writeFileSync(new URL('../src/shapes.json', import.meta.url),JSON.stringify(out));
console.log(out.map(o=>o.k+':'+o.n).join(', '));console.log(JSON.stringify(out).length);
