declare module '@ckeditor/ckeditor5-build-classic' {
  const ClassicEditorBuild: any;
  export = ClassicEditorBuild;
}

declare module '@ckeditor/ckeditor5-core' {
  export interface EditorConfig {
    [key: string]: any;
  }
}