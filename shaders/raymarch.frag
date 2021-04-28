//ray marching fragment shader

#define numOctaves 5
#define H_const 1.264

uniform vec3      iResolution;           // viewport resolution (in pixels)
//uniform float     iTime;                 // shader playback time (in seconds)
uniform float     iTimeDelta;            // render time (in seconds)
uniform int       iFrame;                // shader playback frame
uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
uniform vec3      keyboard;
uniform float     morphing;
uniform int       user;
vec2 st;        
uniform vec3      lightDir; 
uniform bool      lightingBoolean;

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
                   fbm( p + vec2(5.2,1.3),H_const ) );

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

vec2 timeBasedShift(in vec2 st2)
{
    st2 += 0.03*sin( vec2(0.210,0.590)*iTime*0.25 + length(st2*3.0)*vec2(0.830,0.830));
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

        return min(sphere,box) + pattern1(timeBasedShift(vec2(abs(sin(pnt.x)),abs(sin(pnt.y*pnt.z)))))*0.025;
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
        float sphere = sdSphere(pnt,0.4);
        float box = sdBox(pnt,vec3(0.3));
        return smin(sphere,box,0.3);
    }

    //Mozhdeh
    if(user == 4){
        float sphere = sdSphere(pnt,0.4);
        float box = sdBox(pnt,vec3(0.3));
        return max(-sphere,box);
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

vec3 lighting(in vec3 cur_pos,vec3 ray)
{
    if(lightingBoolean){
        float ambient = .1;
        float diffuse_c = 0.6;
        float specular_c = 0.8;
        float specular_k = 20.;

        vec4 p = vec4(cur_pos,1.0);
        //p = opRepeat(p, REPETITION_PERIOD);
        //replacing cur_pos with p.xyz to have similar lighting for all objects
        vec3 N = calc_norm(p.xyz);
        vec3 eyeDir = normalize(-ray);

        //diffuse lighting
        vec3 light_pos = vec3(lightDir.x,-1.*lightDir.y,lightDir.z);
        vec3 L = normalize(p.xyz - light_pos); // vector pointing to light
        float diffuse = max(0.0, dot(N, L)); // lambertian
        if(diffuse != 0.0) { // this check is required to prevent flashing
            diffuse = pattern1(timeBasedShift(vec2(diffuse))); // with noise
        }

        //specular lighting
        vec3 R = 2.0 * dot(N, L) * N - L;
        float specular = pow( max(dot(R, eyeDir), 0.0), specular_k) ;

        //compute final color for each obj
        vec3 color = vec3(0.0);
        if( abs(p.y + 1.0) < MIN_HIT_DIST ) //plane color
        {
            color = vec3(0.5,0.4,0.5) * ambient; 
        }
        else //sphere color
        {
            color = vec3(1.0,1.0,1.0) * ambient;
            color += vec3(1.0,1.0,1.0) * diffuse * diffuse_c;
            color += vec3(1.0,1.0,1.0) * specular * specular_c ;
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

    vec3 col = ray_march(cam_pos, ray);

    // Noise stuff
    vec3 color = vec3(st,1.0);
    st = (uv+1.0)/2.0;
    if(user == 3) {
        st += 0.03*sin( vec2(0.210,0.590)*iTime*3.216 + length(st*3.0)*vec2(0.830,0.830));
        fragColor = vec4(vec3(pattern1(st)*color),1.0);
    }
    else {
        // Output to screen
        fragColor = vec4(col,1.0);

        // Adding noise to screen to create fog
        st += 0.03*sin( vec2(0.210,0.590)*iTime*3.216 + length(st*3.0)*vec2(0.830,0.830));
        fragColor += vec4(vec3(pattern(st)*color),1.0);
    }
    
    
}

void main() 
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}