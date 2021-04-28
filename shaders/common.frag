//ray marching common functions
#include <common>
uniform float     iTime; 

vec4 opRepeat(in vec4 p, in vec4 rep_period)
{
    return mod(p+0.5*rep_period,rep_period)-0.5*rep_period;
}

float sdSphere(in vec3 p, float sphere_radius)
{
    return length(p) - sphere_radius;
}

float sdBox(vec3 p, vec3 dimensions)
{
  vec3 q = abs(p) - dimensions;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}
float sdBox2D(vec2 p, vec2 dimensions)
{
  vec2 q = abs(p) - dimensions;
  return length(max(q,0.0)) + min(max(q.x,q.y),0.0);
}

//taken from: https://github.com/HackerPoet/PySpace
float sdTetrahedron(vec4 p, float r) 
{
    float md = max(max(-p.x - p.y - p.z, p.x + p.y - p.z),
                   max(-p.x + p.y + p.z, p.x - p.y + p.z));
    return (md - r) / (p.w* sqrt(3.0));
}


// Space folding is weird. These sources helped me understand some:
// http://blog.hvidtfeldts.net/index.php/2011/08/distance-estimated-3d-fractals-iii-folding-space/
// https://bellaard.com/articles/Kaleidoscopic%20IFS%20fractals/
// https://youtu.be/svLzmFuSBhk
void sierpinski_fold(inout vec4 p, int folds, float offset)
{
    for (int j = 0; j < folds; j++)
    {
        for (int i = 0; i < folds; i++) 
        {
        if(p.x+p.y<0.0) p.xy = -p.yx; // fold 1
        if(p.x+p.z<0.0) p.xz = -p.zx; // fold 2
        if(p.y+p.z<0.0) p.zy = -p.yz; // fold 3    
        }
        p*= 2.0;
        p.xyz += vec3(-offset);
    }
}




//Prashant helper functions START

mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
	mat4 m = rotationMatrix(axis, angle);
	return (m * vec4(v, 1.0)).xyz;
}

float smin( float a, float b, float k ){
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float opTwist( vec3 p )
{
    const float k = 10.0; // or some other amount
    float c = cos(k*p.y);
    float s = sin(k*p.y);
    mat2  m = mat2(c,-s,s,c);
    vec3  q = vec3(m*p.xz,p.y);
    return sdBox(q,vec3(0.145));
}
float sdCylinder( vec3 p, vec3 c )
{
  return length(p.yz-c.xy)-c.z;
}
float sdTorus( vec3 p, vec2 t )
{
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}
vec2 fold(vec2 p, float ang){
    vec2 n=vec2(cos(-ang),sin(-ang));
    p-=2.*min(0.,dot(p,n))*n;
    return p;
}
vec3 tri_fold(vec3 pt) {
    pt.xy = fold(pt.xy,PI/3.-cos(iTime)/60.);
    pt.xy = fold(pt.xy,-PI/3.);
    pt.yz = fold(pt.yz,-PI/3.+sin(iTime)/40.);
    pt.yz = fold(pt.yz,PI/3.);
    // pt.xz = fold(pt.yz,-PI/2.+sin(iTime)/10.);
    // pt.xz = fold(pt.yz,PI/2.);
    return pt;
}
vec3 tri_curve(vec3 pt) {
    for(int i=0;i<7;i++){
        pt*=2.;
        pt.x-=2.5+sin(iTime)/30.;
        pt.y-=2.5+sin(iTime)/15.;
        pt=tri_fold(pt);
    }
    return pt;
}

float sdMengerBox(vec3 pnt){
    float d = sdBox(pnt,vec3(1.0));

        float s = 1.0;
        for( int m=0; m<4; m++ )
        {
            vec3 a = mod( pnt*s, 2.0 )-1.0;
            s *= 3.0;
            vec3 r = abs(1.0 - 3.0*abs(a));

            float da = max(r.x,r.y);
            float db = max(r.y,r.z);
            float dc = max(r.z,r.x);
            float c = (min(da,min(db,dc))-1.0)/s;

            d = max(d,c);
        }
        return d;
}
float DE(in vec3 pnt, float box_position_x){
    return pnt.x - box_position_x;
}
bool ray_march_sphere(vec3 cam_pos, float box_position_x)
{
    float dist_traveled = 0.0;
    vec3 ray = (vec3(1.0,0.0, 0.0));
    for (int i = 0; i < 100; i++)
    {
        vec3 cur_pos = cam_pos + dist_traveled * ray;
        float dist_to_closest = DE(cur_pos,box_position_x);
        if (dist_to_closest < 0.001)
        {   
            return false;
        }
        if (dist_traveled > 50.)
        {
            break;
        }
        dist_traveled += dist_to_closest;
    }
    return true;
}
//Prashant helper functions END