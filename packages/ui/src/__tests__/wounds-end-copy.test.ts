import { expect, it } from 'vitest';
import { END_SCREEN_COPY } from '../society-view.js';
it('uses the exact approved wounds end copy',()=>{
 expect(END_SCREEN_COPY.wounds).toEqual({title:'Your Lord Has Died',text:'Your wounds proved fatal.'});
});
