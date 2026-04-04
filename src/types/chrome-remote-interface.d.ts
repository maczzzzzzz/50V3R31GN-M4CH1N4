declare module 'chrome-remote-interface' {
  namespace CDP {
    interface Client {
      Page: any;
      Runtime: any;
      CSS: any;
      DOM: any;
      Network: any;
      on(event: string, callback: (params: any) => void): void;
      close(): Promise<void>;
    }

    interface Target {
      type: string;
      webSocketDebuggerUrl?: string;
      id: string;
      title: string;
      url: string;
    }

    interface Options {
      host?: string;
      port?: number;
      target?: string | ((targets: any[]) => any);
    }

    function List(options?: Options): Promise<Target[]>;
    function New(options?: Options): Promise<Target>;
    function Activate(options?: Options): Promise<void>;
    function Close(options?: Options): Promise<void>;
    function Version(options?: Options): Promise<any>;
  }

  function CDP(options?: CDP.Options): Promise<CDP.Client>;

  export default CDP;
}
