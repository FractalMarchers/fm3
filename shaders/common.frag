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