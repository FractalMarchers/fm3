// Author @patriciogv - 2015

#ifdef GL_ES
precision mediump float;
#endif

#define numOctaves 5
#define H_const 1.264

uniform vec2 u_resolution;
uniform float u_time;

float circle(in vec2 _st, in float _radius){
    vec2 l = _st-vec2(0.5);
    return 1.-smoothstep(_radius-(_radius*0.01),
                         _radius+(_radius*0.01),
                         dot(l,l)*4.0);
}

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

void main() {
	vec2 st = gl_FragCoord.xy/u_resolution;
    vec3 color = vec3(st,1.0);
	st += 0.03*sin( vec2(0.210,0.590)*u_time*3.216 + length(st*3.0)*vec2(0.830,0.830));
    
	
    vec3 color1 = vec3(0.490,0.216,0.112);
    vec3 color2 = vec3(0.674,0.720,0.073);
    //gl_FragColor = vec4(mix(color1,color2,pattern1(st)),1.0);
    gl_FragColor = vec4(vec3(pattern1(st)*color),1.0);
}
