import { MdProAngularCliPage } from './app.po';

describe('enquiry-tracker app', () => {
  let page: MdProAngularCliPage;

  beforeEach(() => {
    page = new MdProAngularCliPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
