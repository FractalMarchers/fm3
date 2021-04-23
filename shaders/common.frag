//ray marching common functions
#include <common>


vec4 opRepeat(in vec4 p, in vec4 rep_period)
{
    return mod(p+0.5*rep_period,rep_period)-0.5*rep_period;
}

float sdSphere(in vec3 p, float sphere_radius)
{
    return length(p) - sphere_radius;
}

float sdPlane(in vec3 p, in vec3 plane_point, in vec3 plane_N)
{
    float d = dot(p - plane_point, plane_N);
    return d;
}

float sdBox(vec3 p, vec3 dimensions)
{
  vec3 q = abs(p) - dimensions;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
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


//Prashant helper functions END
