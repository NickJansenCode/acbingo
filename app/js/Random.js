/**
 * This class defines a Random. It contains methods to generate values based on
 * it's seed value.
 * 
 */
class Random {
    
    /**
     * Constructor. Sets the seed.
     * @param {Number} seed The seed.
     */
    constructor(seed) {
        this.seed = seed;
    }

    /**
     * Generates a float value based on the seed.
     */
    nextFloat(){
        let x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    };

    /**
     * Not really sure what this does tbh.
     */
    nextGaussian(){
        let x = this.nextFloat();
        let y = this.nextFloat();
        return Math.sqrt(-2 * Math.log(x)) * Math.cos(2 * Math.PI * y);
    }

    /**
     * Generates an int value based on the seed.
     * @param {Number} z A number to help generate the int.
     */
    nextInt(z){
        return (this.nextFloat() * z) | 0;
    }
}
