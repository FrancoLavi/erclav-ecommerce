export type ActionResult<TData = unknown> =
  | {
      success: true;
      data: TData;
    }
  | {
      success: false;
      error: string;
    };
