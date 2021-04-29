//ray marching fragment shader

#define numOctaves 5
#define H_const 1.0

uniform vec3      iResolution;           // viewport resolution (in pixels)
//uniform float     iTime;                 // shader playback time (in seconds)
uniform float     iTimeDelta;            // render time (in seconds)
uniform int       iFrame;                // shader playback frame
uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
uniform vec3      keyboard;
uniform float     morphing;
uniform int       user;
uniform vec3      lightDir; 
uniform bool      lightingBoolean;
vec2 st;

const float INFINITY = 1e20;
const int   NUMBER_OF_STEPS = 100;
const float MIN_HIT_DIST    = 0.001;
const float MAX_TRACE_DIST  = 40.0;
const int ITERATIONS = 5; // how many times to fold
const float SCALE = 1.0; // size of sdf shapes
const float OFFSET = 1.0; // offset for any sdf that uses distance shifting
const vec4 REPETITION_PERIOD = vec4(16.0,5.0,8.0,12.0); // how often to repeat--higher numbers repeat less often
float box_position_x = 0.;
float sphere_position_x = 0.;
bool dir = true;

//Added by Sid
// Starts here
vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

vec2 hash( vec2 p ) // replace this by something better
{
	p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) );
	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

vec3 hash( vec3 p ) // replace this by something better
{
	p = vec3( dot(p,vec3(127.1,311.7,232.4)), dot(p,vec3(269.5,183.3,312.1)), dot(p,vec3(162.5,653.3,234.1)) );
	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

//Returns 3D noise
float noise3D( in vec3 x )
{
    // grid
    vec3 p = floor(x);
    vec3 w = fract(x);
    
    // quintic interpolant
    vec3 u = w*w*w*(w*(w*6.0-15.0)+10.0);

    
    // gradients
    vec3 ga = hash( p+vec3(0.0,0.0,0.0) );
    vec3 gb = hash( p+vec3(1.0,0.0,0.0) );
    vec3 gc = hash( p+vec3(0.0,1.0,0.0) );
    vec3 gd = hash( p+vec3(1.0,1.0,0.0) );
    vec3 ge = hash( p+vec3(0.0,0.0,1.0) );
    vec3 gf = hash( p+vec3(1.0,0.0,1.0) );
    vec3 gg = hash( p+vec3(0.0,1.0,1.0) );
    vec3 gh = hash( p+vec3(1.0,1.0,1.0) );
    
    // projections
    float va = dot( ga, w-vec3(0.0,0.0,0.0) );
    float vb = dot( gb, w-vec3(1.0,0.0,0.0) );
    float vc = dot( gc, w-vec3(0.0,1.0,0.0) );
    float vd = dot( gd, w-vec3(1.0,1.0,0.0) );
    float ve = dot( ge, w-vec3(0.0,0.0,1.0) );
    float vf = dot( gf, w-vec3(1.0,0.0,1.0) );
    float vg = dot( gg, w-vec3(0.0,1.0,1.0) );
    float vh = dot( gh, w-vec3(1.0,1.0,1.0) );
	
    // interpolation
    return va + 
           u.x*(vb-va) + 
           u.y*(vc-va) + 
           u.z*(ve-va) + 
           u.x*u.y*(va-vb-vc+vd) + 
           u.y*u.z*(va-vc-ve+vg) + 
           u.z*u.x*(va-vb-ve+vf) + 
           u.x*u.y*u.z*(-va+vb+vc-vd+ve-vf-vg+vh);
}

float noiseVoronoi( in vec2 x )
{
    vec2 p = floor( x );
    vec2  f = fract( x );

    float res = 8.0;
    for( int j=-1; j<=1; j++ )
    for( int i=-1; i<=1; i++ )
    {
        vec2 b = vec2( i, j );
        vec2  r = vec2( b ) - f + random2( p + b );
        float d = dot( r, r );

        res = min( res, d );
    }
    return sqrt( res );
}

float noiseSimplex( in vec2 p )
{
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;

	vec2  i = floor( p + (p.x+p.y)*K1 );
    vec2  a = p - i + (i.x+i.y)*K2;
    float m = step(a.y,a.x); 
    vec2  o = vec2(m,1.0-m);
    vec2  b = a - o + K2;
	vec2  c = a - 1.0 + 2.0*K2;
    vec3  h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
	vec3  n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
    return dot( n, vec3(70.0) );
}

// 2D noise
float fbm( in vec2 x, in float H )
{    
    float G = exp2(-H);
    float f = 1.0;
    float a = 1.0;
    float t = 0.0;
    for( int i=0; i<numOctaves; i++ )
    {
        t += a*noiseSimplex(f*x);
        f *= 2.0;
        a *= G;
    }
    return t;
}

float pattern( in vec2 p )
{
    return fbm(p+ vec2(0.0,0.0),H_const);
}

float pattern1( in vec2 p )
{
    vec2 q = vec2( fbm( p + vec2(0.0,0.0),H_const ),
                   fbm( p + vec2(5.2,1.3),H_const ));

    return fbm( p + 4.0*q, H_const );
}

float pattern2( in vec2 p )
{
    vec2 q = vec2( fbm( p + vec2(0.0,0.0),H_const ),
                   fbm( p + vec2(5.2,1.3),H_const ) );

    vec2 r = vec2( fbm( p + 4.0*q + vec2(1.7,9.2),H_const ),
                   fbm( p + 4.0*q + vec2(8.3,2.8),H_const ) );

    return fbm( p + 4.0*r,H_const );
}

// 3D noise
float fbm( in vec3 x, in float H )
{    
    float G = exp2(-H);
    float f = 1.0;
    float a = 1.0;
    float t = 0.0;
    for( int i=0; i<numOctaves; i++ )
    {
        t += a*noise3D(f*x);
        f *= 2.0;
        a *= G;
    }
    return t;
}

float pattern( in vec3 p )
{
    return fbm(p+ vec3(0.0,0.0,0.0),H_const);
}

float pattern1( in vec3 p )
{
    vec3 q = vec3( fbm( p + vec3(0.0,0.0,0.0),H_const ),
                   fbm( p + vec3(5.2,1.3,2.1),H_const ),
                   fbm( p + vec3(7.3,0.5,3.6),H_const ));

    return fbm( p + 4.0*q, H_const );
}

float pattern2( in vec3 p )
{
    vec3 q = vec3( fbm( p + vec3(0.0,0.0,0.0),H_const ),
                   fbm( p + vec3(5.2,1.3,2.1),H_const ),
                   fbm( p + vec3(7.3,0.5,3.6),H_const ));

    vec3 r = vec3( fbm( p + 4.0*q + vec3(1.7,9.2,5.2),H_const ),
                   fbm( p + 4.0*q + vec3(8.3,2.8,6.4),H_const ),
                   fbm( p + 4.0*q + vec3(4.6,3.9,8.4),H_const ));

    return fbm( p + 4.0*r,H_const );
}

vec2 timeBasedShift(in vec2 st2)
{
    st2 += 0.03*sin( vec2(0.210,0.590)*iTime*0.25 + length(st2*3.0)*vec2(0.830,0.830));
    return st2;
}

vec3 timeBasedShift(in vec3 st2)
{
    st2 += 0.03*sin( vec3(0.210,0.590,0.370)*iTime*0.25 + length(st2*3.0)*vec3(0.830,0.830,0.830));
    return st2;
}

// Added by Sid
// Ends here

// returns distance to nearest object in the world
float sdf(in vec3 pnt)
{   
    //Prashant
    if(user == 6){
        float mengerBox = sdMengerBox(pnt);
        vec3 pnt = tri_curve(pnt);
        float mengerBoxFold = sdMengerBox(pnt*0.004);
        return mix(mengerBox,mengerBoxFold,morphing);
    }
    if(user == 1){
        if(dir)
            sphere_position_x = pnt.x + 1.5 - iTime/5.;
        else
            sphere_position_x = pnt.x - 0.1 + iTime/5.;
            
        float sphere = sdSphere(
            vec3(sphere_position_x,pnt.y,pnt.z),
            0.4
        );
        box_position_x = pnt.x;
        float box = sdBox(
            vec3(box_position_x,pnt.y,pnt.z),
            vec3(0.3)
        );

        if(dir)
            dir = ray_march_sphere(vec3(sphere_position_x-0.4-0.3,pnt.y,pnt.z),box_position_x);

        //return min(sphere,box) + pattern1(timeBasedShift(vec2(abs(sin(pnt.x)),abs(sin(pnt.y*pnt.z)))))*0.025;
        return min(sphere,box);
    }

    //Michael
    else if(user == 2){
        vec4 p = vec4(pnt,1.0);
        //p = opRepeat(p, REPETITION_PERIOD); //infinite repetition
        sierpinski_fold(p, ITERATIONS, OFFSET);
        return min(INFINITY, sdTetrahedron(p,SCALE));
    }

    //Siddhant
    if(user == 3){
        // float sphere = sdSphere(pnt,0.4);
        // float box = sdBox(pnt,vec3(0.3));
        // return smin(sphere,box,0.3);

        if(dir)
            sphere_position_x = pnt.x + 1.5 - iTime/5.;
        else
            sphere_position_x = pnt.x - 0.1 + iTime/5.;
            
        float sphere = sdSphere(
            vec3(sphere_position_x,pnt.y,pnt.z),
            0.4
        );
        box_position_x = pnt.x;
        float box = sdBox(
            vec3(box_position_x,pnt.y,pnt.z),
            vec3(0.3)
        );

        if(dir)
            dir = ray_march_sphere(vec3(sphere_position_x-0.4-0.3,pnt.y,pnt.z),box_position_x);

        //return min(sphere,box) + pattern1(timeBasedShift(vec2(abs(sin(pnt.x)),abs(sin(pnt.y*pnt.z)))))*0.025;
        //return min(sphere,box) + pattern1(timeBasedShift(pnt))*0.075;
        return min(sphere,box);
    }

    //Mozhdeh
    if(user == 4){
        vec4 p = vec4(pnt,1.0);
        p = opRepeat(p, vec4(4.2,0.0,4.2,0.0)); //infinite repetition
        float closest = min(sdSphere(p.xyz,SCALE), sdPlane(p.xyz, vec3(0.0, -1.0, 0.0), vec3(0.0, 1.0, 0.0)));
        return min(INFINITY, closest);
    }

    //Kaushik
    if(user == 5){
        float sphere = sdSphere(pnt,0.4);
        float box = sdBox(pnt,vec3(0.3));
        return max(sphere,-box);
    }
}

//calculate the normal of a 3d surface
vec3 calc_norm(in vec3 point)
{
    const vec3 SMALL_STEP = vec3(0.001, 0.0, 0.0);

    float gradient_x = sdf(point + SMALL_STEP.xyy) - sdf(point - SMALL_STEP.xyy);
    float gradient_y = sdf(point + SMALL_STEP.yxy) - sdf(point - SMALL_STEP.yxy);
    float gradient_z = sdf(point + SMALL_STEP.yyx) - sdf(point - SMALL_STEP.yyx);
    return normalize(vec3(gradient_x, gradient_y, gradient_z));
}


bool ray_march_hit(in vec3 cam_pos, in vec3 ray)
{
    float dist_traveled = 0.0;

    for (int i = 0; i < NUMBER_OF_STEPS; i++)
    {
        vec3 cur_pos = cam_pos + dist_traveled * ray;
        float dist_to_closest = sdf(cur_pos);
        if (dist_to_closest < MIN_HIT_DIST)
        {            
            return true;
        }
        if (dist_traveled > MAX_TRACE_DIST)
        {
            break;
        }
        dist_traveled += dist_to_closest;
    }
    return false; // hit nothing, return black.
}

vec3 lighting(in vec3 cur_pos, in vec3 ray)
{
    if(lightingBoolean){
        float ambient = 0.3;
        float diffuse_c = 0.6;
        float specular_c = 0.4;
        float specular_k = 20.0;

        vec4 p = vec4(cur_pos,1.0);
        p = opRepeat(p, REPETITION_PERIOD);
        //replacing cur_pos with p.xyz to have similar lighting for all objects
        
        vec3 light_pos = lightDir;
        vec3 N = calc_norm(p.xyz);
        vec3 eyeDir = normalize(-ray);
        vec3 L = normalize(p.xyz - light_pos); // vector pointing to light

        bool hit = ray_march_hit(cur_pos + N * MIN_HIT_DIST * 4.0, L);// + 
        if (hit == true)
        {
            return vec3(0.0);
        }
        //diffuse lighting
        float diffuse = max(0.0, dot(N, L)); // lambertian
        

        //specular lighting
        vec3 R = 2.0 * dot(N, L) * N - L;
        float specular = pow( max(dot(R, eyeDir), 0.0), specular_k) ;

        //If user is Siddhant add noise to light components to make it fake
        if(user == 3) {
            if(diffuse != 0.0) {
                vec3 lightNoise = vec3(pattern2(timeBasedShift(vec3(ambient,diffuse,specular)))); // with noise
                ambient += lightNoise.r;
                diffuse += lightNoise.g;
                specular += lightNoise.b;
            }
        }

        //compute final color for each obj
        vec3 color = vec3(0.0);
        if( abs(p.y + 1.0) < MIN_HIT_DIST ) //plane color
        {
            //color = vec3(0.55,0.4,0.55) * ambient;
            color = vec3(1.6)* ambient; 
        }
        else //sphere color
        {
            // If user is Siddhant add colored light
            if(user == 3) {
                color = vec3(1.0,0.0,0.0) * ambient;
                color += vec3(0.0,1.0,0.0) * diffuse * diffuse_c;
                color += vec3(0.0,0.0,1.0) * specular * specular_c ;
            } else {
                color = vec3(1.0,1.0,1.0) * ambient;
                color += vec3(1.0,1.0,1.0) * diffuse * diffuse_c;
                color += vec3(1.0,1.0,1.0) * specular * specular_c ;
            
                //color change over time
                
                if(int((iTime*24.0) / 125.0) % 2 ==1 )
                {
                    color.x *= float(int((iTime*24.0))%125)/125.0;
                }
                else
                {
                    color.x *= 1.2 - float(int((iTime*24.0))%125)/125.0;
                }
                if(int((iTime*10.0) / 125.0) % 2 ==1 )
                {
                    color.y *= float(int((iTime*10.0))%125)/125.0;
                }
                else
                {
                    color.y *= 1.2 - float(int((iTime*10.0))%125)/125.0;
                }
                
                if(int((iTime*4.0)/ 125.0) % 2 ==1 )
                {
                    color.z *= float(int(iTime*4.0)%125)/125.0;
                }
                else
                {
                    color.z *= 1.2 - float(int(iTime*4.0)%125)/125.0;
                }
            }

        }
        return color;
    }
    else{
        vec3 N = calc_norm(cur_pos);
        return N * 0.5 + 0.5; 
    }
}


vec3 ray_march(in vec3 cam_pos, in vec3 ray)
{
    float dist_traveled = 0.0;

    for (int i = 0; i < NUMBER_OF_STEPS; i++)
    {
        vec3 cur_pos = cam_pos + dist_traveled * ray;
        float dist_to_closest = sdf(cur_pos);
        if (dist_to_closest < MIN_HIT_DIST)
        {            
            return lighting(cur_pos,ray);
        }
        if (dist_traveled > MAX_TRACE_DIST)
        {
            break;
        }
        dist_traveled += dist_to_closest;
    }
    return vec3(0.0); // hit nothing, return black.
}

vec3 reflection(in vec3 cam_pos, in vec3 ray)
{

    float reflection_c = 0.25; 
    int reflection_depth = 3; // the number of reflections, 1 means no reflection

    vec3 col = vec3(0.0);
    float dist_traveled = 0.0;
    vec3 reflect_col = vec3(0.0);
    float hit_flag = 0.0;
    vec3 cur_pos = cam_pos;

    for (int depth = 0; depth < reflection_depth; depth++)
    {
        dist_traveled = 0.0;
        reflect_col = vec3(0.0);
        hit_flag = 0.0;

        //ray marching loop
        for (int i = 0; i < NUMBER_OF_STEPS; i++)
        {
            cur_pos = cam_pos + dist_traveled * ray;
            float dist_to_closest = sdf(cur_pos);
            if (dist_to_closest < MIN_HIT_DIST)
            {            
                reflect_col = lighting(cur_pos, ray);
                hit_flag = 1.0;
                break;
            }
            if (dist_traveled > MAX_TRACE_DIST)
            {
                break;
            }
            dist_traveled += dist_to_closest;
        }

        //no object found, stop reflection
        if (hit_flag < 1.0) 
        {
           break;
        }
        
        col += reflect_col * pow(reflection_c, float (depth));
        //compute new reflection pos and ray 
        vec3 N = calc_norm(cur_pos);
        cam_pos = cur_pos + N * MIN_HIT_DIST;
        ray = normalize(ray - 2.0 * dot(ray, N) * N);
    }
    return col;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1) then remap to -1 to 1
    vec2 uv = (fragCoord/iResolution.xy)*2.0 - 1.0;
    vec2 mouse = (iMouse.xy/iResolution.xy)*10.0;
    vec3 cam_pos = vec3(keyboard.x, keyboard.y, keyboard.z); //our "camera" position
    // vec3 cam_pos = vec3(0.0, 0.0, 2.0);
    vec3 ray = normalize(vec3(uv, -1.0));
    ray = rotate(ray, vec3(0.0,1.0, 0.0), mouse.x);
    ray = rotate(ray, vec3(1.0,0.0, 0.0), mouse.y);

    //vec3 col = ray_march(cam_pos, ray);
    vec3 col = reflection(cam_pos, ray);

    // Output to screen
    fragColor = vec4(col,1.0);

    // Noise stuff
    bool show2DNoise = false;
    st = (uv+1.0)/2.0;
    vec3 color = vec3(st,1.0);
    if(user == 3 && show2DNoise) {
        st += 0.03*sin( vec2(0.210,0.590)*iTime*3.216 + length(st*3.0)*vec2(0.830,0.830));
        fragColor = vec4(vec3(pattern1(st)*color),1.0);
    }
}

void main() 
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
